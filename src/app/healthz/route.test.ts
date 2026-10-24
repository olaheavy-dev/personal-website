import { GET } from "./route";

describe("/healthz", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports ok and the commit baked in at build time", async () => {
    vi.stubEnv("BUILD_SHA", "0123456789abcdef0123456789abcdef01234567");
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ok",
      sha: "0123456789abcdef0123456789abcdef01234567",
    });
  });

  it("says dev when no commit was baked in", async () => {
    vi.stubEnv("BUILD_SHA", undefined);
    expect(await GET().json()).toEqual({ status: "ok", sha: "dev" });
  });
});
