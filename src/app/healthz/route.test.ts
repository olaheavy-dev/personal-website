import { GET } from "./route";

// connection() only works inside a real request; the route's behaviour does not depend on it.
vi.mock("next/server", () => ({ connection: async () => undefined }));

describe("/healthz", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports ok and the commit baked in at build time", async () => {
    vi.stubEnv("BUILD_SHA", "0123456789abcdef0123456789abcdef01234567");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      status: "ok",
      sha: "0123456789abcdef0123456789abcdef01234567",
    });
  });

  it("says dev when no commit was baked in", async () => {
    vi.stubEnv("BUILD_SHA", undefined);
    expect(await (await GET()).json()).toMatchObject({ status: "ok", sha: "dev" });
  });

  it("says configured when the Supabase browser values are present, and never shows them", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_dummyvalue");
    const response = await GET();
    const text = await response.text();
    expect(JSON.parse(text).supabase).toBe("configured");
    expect(text).not.toContain("abcdefghijklmnopqrst");
    expect(text).not.toContain("sb_publishable_");
  });

  it("says unconfigured when they are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect((await (await GET()).json()).supabase).toBe("unconfigured");
  });
});
