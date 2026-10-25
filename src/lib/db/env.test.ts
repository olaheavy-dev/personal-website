import { readPublicEnv, readServerEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc",
  SUPABASE_SECRET_KEY: "sb_secret_abc",
};

describe("readPublicEnv", () => {
  it("reads a valid public environment", () => {
    expect(readPublicEnv(valid)).toEqual({
      ok: true,
      data: { url: "https://abc.supabase.co", publishableKey: "sb_publishable_abc" },
    });
  });

  it("reports unconfigured when a value is missing", () => {
    expect(readPublicEnv({})).toMatchObject({ ok: false, reason: "unconfigured" });
    expect(readPublicEnv({ NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL })).toMatchObject({
      ok: false,
      reason: "unconfigured",
    });
  });

  it("rejects the legacy anon key, even next to valid new keys", () => {
    const result = readPublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ.legacy.key" });
    expect(result).toMatchObject({ ok: false, reason: "invalid_config" });
    expect(JSON.stringify(result)).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(JSON.stringify(result)).not.toContain("eyJ.legacy.key");
  });

  it("rejects a key with the wrong prefix", () => {
    const result = readPublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOi" });
    expect(result).toMatchObject({ ok: false, reason: "invalid_config" });
    expect(JSON.stringify(result)).not.toContain("eyJhbGciOi");
  });

  it("requires https, except http on localhost", () => {
    expect(readPublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://abc.supabase.co" })).toMatchObject({
      ok: false,
      reason: "invalid_config",
    });
    expect(readPublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toMatchObject({
      ok: false,
      reason: "invalid_config",
    });
    expect(readPublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }).ok).toBe(true);
  });
});

describe("readServerEnv", () => {
  it("reads the secret key as well", () => {
    expect(readServerEnv(valid)).toEqual({
      ok: true,
      data: {
        url: "https://abc.supabase.co",
        publishableKey: "sb_publishable_abc",
        secretKey: "sb_secret_abc",
      },
    });
  });

  it("needs the secret key", () => {
    const withoutSecret = { ...valid, SUPABASE_SECRET_KEY: undefined };
    expect(readServerEnv(withoutSecret)).toMatchObject({ ok: false, reason: "unconfigured" });
  });

  it("rejects the legacy service role key and a secret key with the wrong prefix", () => {
    expect(readServerEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "eyJ.service" })).toMatchObject({
      ok: false,
      reason: "invalid_config",
    });
    expect(readServerEnv({ ...valid, SUPABASE_SECRET_KEY: "eyJ.service" })).toMatchObject({
      ok: false,
      reason: "invalid_config",
    });
  });
});
