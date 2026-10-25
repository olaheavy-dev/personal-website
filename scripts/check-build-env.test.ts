import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { checkBuildEnv } from "./check-build-env.mjs";

const url = "https://abcdefghijklmnopqrst.supabase.co";
const key = "sb_publishable_abc123";
const script = join(resolve(__dirname), "check-build-env.mjs");

function run(env: Record<string, string>) {
  return spawnSync("node", [script], {
    env: { PATH: process.env.PATH ?? "", ...env },
    encoding: "utf8",
  });
}

describe("checkBuildEnv", () => {
  it("accepts a valid URL and key", () => {
    expect(
      checkBuildEnv({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }),
    ).toEqual([]);
  });

  it("reports both values missing", () => {
    const problems = checkBuildEnv({});
    expect(problems).toHaveLength(2);
    expect(problems.join(" ")).toContain("NEXT_PUBLIC_SUPABASE_URL is missing");
    expect(problems.join(" ")).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing");
  });

  it.each([
    "http://abcdefghijklmnopqrst.supabase.co",
    "https://abcdefghijklmnopqrs.supabase.co",
    "https://abcdefghijklmnopqrstu.supabase.co",
    "https://ABCDEFGHIJKLMNOPQRST.supabase.co",
    "https://abcdefghijklmnopqrst.supabase.co/",
    "https://abcdefghijklmnopqrst.supabase.com",
    "https://abcdefghijklmnopqrst.supabase.co.evil.example",
  ])("rejects the URL %s", (bad) => {
    const problems = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: bad,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects a key without the publishable prefix, such as a legacy or secret key", () => {
    for (const bad of ["sb_secret_abc123", "eyJhbGciOiJIUzI1NiJ9.x.y"]) {
      const problems = checkBuildEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bad,
      });
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain("sb_publishable_");
    }
  });

  it("never prints a value in its messages", () => {
    const bad = "wrong_topsecretvalue";
    const problems = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://leaky.example",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bad,
    });
    const text = problems.join(" ");
    expect(text).not.toContain(bad);
    expect(text).not.toContain("leaky.example");
  });
});

describe("check-build-env command", () => {
  it("exits 1 and names the variables when they are missing", () => {
    const result = run({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("exits 1 without echoing a bad value", () => {
    const result = run({
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "wrong_topsecretvalue",
    });
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).not.toContain("topsecretvalue");
  });

  it("exits 0 for valid values", () => {
    const result = run({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    expect(result.status).toBe(0);
  });
});
