// The Database Webhook that calls /api/revalidate is set up by hand in the Supabase
// dashboard (docs/database.md), because its Authorization header holds REVALIDATE_SECRET and
// a migration would put that secret in this public repository. `supabase db pull` would
// write the webhook, header included, into a migration: this test fails if that ever
// happens, so a pull cannot be committed by accident.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const forbidden = [/http_request/, /Authorization/];

function files() {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "supabase"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
}

describe("supabase/ holds no webhook and no Authorization header", () => {
  it("has files to check", () => {
    expect(files().length).toBeGreaterThan(5);
  });

  it.each(forbidden.map((pattern) => [pattern.source, pattern] as const))(
    "contains nothing matching %s",
    (_name, pattern) => {
      const offenders = files().filter((file) => {
        const path = resolve(root, file);
        return existsSync(path) && pattern.test(readFileSync(path, "utf8"));
      });
      expect(offenders).toEqual([]);
    },
  );
});
