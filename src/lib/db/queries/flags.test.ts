import { cacheLife, cacheTag } from "next/cache";
import { fakeClient } from "../fake-client";
import { createPublicClient } from "../public-client";
import { success } from "../result";
import { forgetLastGoodFlags, getFlags } from "./flags";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("../public-client", () => ({ createPublicClient: vi.fn() }));

function configure() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_dummyvalue");
}

const reads = (rows: unknown) => success(fakeClient({ data: rows, error: null }).client);
const outage = () => success(fakeClient({ data: null, error: { message: "fake outage" } }).client);

describe("getFlags", () => {
  beforeEach(() => {
    vi.mocked(cacheLife).mockClear();
    vi.mocked(cacheTag).mockClear();
    vi.mocked(createPublicClient).mockReset();
    forgetLastGoodFlags();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns the flag map, tagged and cached for hours", async () => {
    configure();
    vi.mocked(createPublicClient).mockReturnValue(reads([{ key: "page.work", state: "on" }]));
    expect(await getFlags()).toEqual({ "page.work": "on" });
    expect(cacheTag).toHaveBeenCalledWith("flags");
    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheLife).toHaveBeenCalledTimes(1);
  });

  it("returns an empty map (everything off) only when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await getFlags()).toEqual({});
    expect(createPublicClient).not.toHaveBeenCalled();
  });

  it("throws when configured and the read fails with nothing read before, so a build fails", async () => {
    configure();
    vi.mocked(createPublicClient).mockReturnValue(outage());
    await expect(getFlags()).rejects.toThrow(/cannot be read: fake outage/);
    expect(cacheLife).not.toHaveBeenCalled();
  });

  it("throws when the request itself throws", async () => {
    configure();
    const broken = {
      from: () => {
        throw new Error("fetch failed");
      },
    } as never;
    vi.mocked(createPublicClient).mockReturnValue(success(broken));
    await expect(getFlags()).rejects.toThrow(/fetch failed/);
  });

  it("throws on a malformed configuration instead of treating it as off", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://not-local.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_dummyvalue");
    // The real client factory hands a bad configuration straight back as a failure.
    vi.mocked(createPublicClient).mockImplementation((env) => env as never);
    await expect(getFlags()).rejects.toThrow(/cannot be read/);
  });

  it("keeps the last good flags for a minute when a later read fails", async () => {
    configure();
    vi.mocked(createPublicClient).mockReturnValue(reads([{ key: "page.work", state: "on" }]));
    await getFlags();
    vi.mocked(cacheLife).mockClear();

    vi.mocked(createPublicClient).mockReturnValue(outage());
    expect(await getFlags()).toEqual({ "page.work": "on" });
    expect(cacheLife).toHaveBeenCalledTimes(1);
    expect(cacheLife).toHaveBeenCalledWith({ stale: 30, revalidate: 60, expire: 3600 });
  });

  it("uses the new flags as soon as a read works again", async () => {
    configure();
    vi.mocked(createPublicClient).mockReturnValue(reads([{ key: "page.work", state: "on" }]));
    await getFlags();
    vi.mocked(createPublicClient).mockReturnValue(reads([]));
    expect(await getFlags()).toEqual({});
  });
});
