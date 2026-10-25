import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";
import { failure, success } from "./result";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ fake: true })) }));

const serverEnv = success({
  url: "https://abc.supabase.co",
  publishableKey: "sb_publishable_abc",
  secretKey: "sb_secret_abc",
});

afterEach(() => {
  vi.mocked(createClient).mockClear();
  vi.unstubAllGlobals();
});

describe("createAdminClient", () => {
  it("refuses to run where there is a window (the browser)", () => {
    expect(typeof window).toBe("object"); // jsdom
    expect(() => createAdminClient(serverEnv)).toThrow(/never run in the browser/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("uses the secret key on the server", () => {
    vi.stubGlobal("window", undefined);
    const result = createAdminClient(serverEnv);
    expect(result.ok).toBe(true);
    expect(createClient).toHaveBeenCalledWith("https://abc.supabase.co", "sb_secret_abc", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });

  it("reports an environment failure instead of throwing", () => {
    vi.stubGlobal("window", undefined);
    const result = createAdminClient(failure("unconfigured", "Supabase is not configured."));
    expect(result).toMatchObject({ ok: false, reason: "unconfigured" });
  });
});
