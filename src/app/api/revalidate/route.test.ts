import { revalidateTag } from "next/cache";
import { after } from "next/server";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));

const secret = "test-secret-value";

// A fresh module per test, so the in-memory rate limit starts empty.
async function load() {
  vi.resetModules();
  return import("./route");
}

function post(init: { auth?: string | null; body?: unknown; ip?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.auth !== null) headers.authorization = init.auth ?? `Bearer ${secret}`;
  if (init.ip) headers["x-forwarded-for"] = init.ip;
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers,
    body: JSON.stringify(init.body ?? { type: "UPDATE", table: "feature_flags", schema: "public" }),
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(after).mockClear();
    vi.stubEnv("REVALIDATE_SECRET", secret);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("revalidates the flags tag, with stale pages never served, for the Supabase webhook body", async () => {
    const { POST } = await load();
    const response = await POST(post());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: "flags" });
    expect(revalidateTag).toHaveBeenCalledWith("flags", { expire: 0 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("expires the tag again a few seconds later, for a page whose render straddled the change", async () => {
    // Next.js stamps a rebuilt page with the time it finished, so a render that began before the
    // change and ended after the first revalidation would otherwise be served as fresh with the
    // old flags until the next revalidation (see the comment in route.ts).
    vi.useFakeTimers();
    try {
      const { POST } = await load();
      await POST(post());
      expect(revalidateTag).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
      const later = vi.mocked(after).mock.calls[0]![0] as () => Promise<void>;
      const done = later();
      await vi.advanceTimersByTimeAsync(4_999);
      expect(revalidateTag).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await done;
      expect(revalidateTag).toHaveBeenCalledTimes(2);
      expect(revalidateTag).toHaveBeenLastCalledWith("flags", { expire: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("schedules nothing for a refused call", async () => {
    const { POST } = await load();
    await POST(post({ auth: "Bearer nope" }));
    await POST(post({ body: { table: "settings" } }));
    expect(after).not.toHaveBeenCalled();
  });

  it("also accepts a direct call naming the tag", async () => {
    const { POST } = await load();
    expect((await POST(post({ body: { tag: "flags" } }))).status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("flags", { expire: 0 });
  });

  it("answers 503 and does nothing when the secret is not set", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const { POST } = await load();
    expect((await POST(post())).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("answers 503 even for an empty bearer token when the secret is not set", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const { POST } = await load();
    expect((await POST(post({ auth: "Bearer " }))).status).toBe(503);
  });

  it.each([
    ["no header", null],
    ["a wrong secret", "Bearer nope"],
    ["a wrong secret of the same length", `Bearer ${"x".repeat(secret.length)}`],
    ["an empty token", "Bearer "],
    ["another scheme", `Basic ${secret}`],
    ["the bare secret", secret],
  ])("answers 401 with %s", async (_name, auth) => {
    const { POST } = await load();
    const response = await POST(post({ auth }));
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown table", { table: "settings" }],
    ["an unknown tag", { tag: "case-studies" }],
    ["a tag that only looks like a table", { table: "flags" }],
    ["an empty body", {}],
    ["a non object body", "flags"],
  ])("answers 400 for %s, so only allow listed tags can be refreshed", async (_name, body) => {
    const { POST } = await load();
    expect((await POST(post({ body }))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("answers 400 for a body that is not JSON", async () => {
    const { POST } = await load();
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      body: "not json",
    });
    expect((await POST(request)).status).toBe(400);
  });

  it("allows 30 wrong attempts a minute from one address and then answers 429", async () => {
    const { POST } = await load();
    const statuses: number[] = [];
    for (let i = 0; i < 32; i++) {
      statuses.push((await POST(post({ auth: "Bearer nope", ip: "203.0.113.9" }))).status);
    }
    expect(statuses.slice(0, 30).every((status) => status === 401)).toBe(true);
    expect(statuses.slice(30)).toEqual([429, 429]);
    // Another address is unaffected.
    expect((await POST(post({ auth: "Bearer nope", ip: "203.0.113.10" }))).status).toBe(401);
  });

  it("ignores a spoofed cf-connecting-ip, so rotating it does not change the bucket", async () => {
    const { POST } = await load();
    const statuses: number[] = [];
    for (let i = 0; i < 32; i++) {
      const request = post({ auth: "Bearer nope", ip: "203.0.113.9" });
      request.headers.set("cf-connecting-ip", `198.51.100.${i}`);
      statuses.push((await POST(request)).status);
    }
    expect(statuses.slice(30)).toEqual([429, 429]);
  });

  it("never limits a caller with the right secret, even from an address that has been guessing", async () => {
    const { POST } = await load();
    for (let i = 0; i < 40; i++) await POST(post({ auth: "Bearer nope", ip: "203.0.113.9" }));
    expect((await POST(post({ ip: "203.0.113.9" }))).status).toBe(200);
    for (let i = 0; i < 40; i++) {
      expect((await POST(post({ ip: "203.0.113.11" }))).status).toBe(200);
    }
  });

  it("exports no other method, so Next answers 405 for them", async () => {
    const route = await load();
    expect(Object.keys(route).filter((name) => /^(GET|PUT|PATCH|DELETE|HEAD)$/.test(name))).toEqual([]);
  });
});
