import { createClient } from "@supabase/supabase-js";
import { createPublicClient } from "./public-client";
import { failure, success } from "./result";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ fake: true })) }));

const publicEnv = success({ url: "https://abc.supabase.co", publishableKey: "sb_publishable_abc" });

afterEach(() => {
  vi.mocked(createClient).mockClear();
  vi.unstubAllGlobals();
});

describe("createPublicClient", () => {
  it("uses the publishable key and keeps no session", () => {
    const result = createPublicClient(publicEnv);
    expect(result.ok).toBe(true);
    expect(createClient).toHaveBeenCalledWith("https://abc.supabase.co", "sb_publishable_abc", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });

  it("passes an environment failure through without creating a client", () => {
    const result = createPublicClient(failure("unconfigured", "Supabase is not configured."));
    expect(result).toMatchObject({ ok: false, reason: "unconfigured" });
    expect(createClient).not.toHaveBeenCalled();
  });
});
