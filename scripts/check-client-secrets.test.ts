import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkBundleText, checkSourceText } from "./check-client-secrets.mjs";

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${b64({ iss: "supabase", role })}.signature`;

describe("checkBundleText", () => {
  it("accepts a bundle with a publishable key", () => {
    expect(checkBundleText("a.js", 'const k="sb_publishable_abcdefghij";')).toEqual([]);
    expect(checkBundleText("a.js", `const anon="${jwt("anon")}";`)).toEqual([]);
  });

  it("rejects a secret key", () => {
    expect(checkBundleText("a.js", 'const k="sb_secret_abcdefghijkl";')).toHaveLength(1);
  });

  it("rejects the names of the secret variables", () => {
    expect(checkBundleText("a.js", "process.env.SUPABASE_SECRET_KEY")).toHaveLength(1);
    expect(checkBundleText("a.js", "process.env.SUPABASE_SERVICE_ROLE_KEY")).toHaveLength(1);
  });

  it("rejects the name of the revalidate secret", () => {
    expect(checkBundleText("a.js", "process.env.REVALIDATE_SECRET")).toHaveLength(1);
  });

  it("rejects a service_role JWT but not an anon one", () => {
    expect(checkBundleText("a.js", `x("${jwt("service_role")}")`)).toHaveLength(1);
  });
});

describe("checkSourceText", () => {
  it("rejects a public variable that carries a secret", () => {
    expect(checkSourceText(".env.example", "NEXT_PUBLIC_SUPABASE_SECRET_KEY=x")).toHaveLength(1);
    expect(checkSourceText("a.ts", "process.env.NEXT_PUBLIC_SERVICE_ROLE")).toHaveLength(1);
    expect(checkSourceText("a.ts", "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")).toEqual([]);
  });

  it("rejects a client component that imports the secret key client", () => {
    const client = '"use client";\nimport { createAdminClient } from "@/lib/db/admin";\n';
    expect(checkSourceText("c.tsx", client)).toHaveLength(1);
    expect(checkSourceText("c.tsx", "// note\n" + client)).toHaveLength(1);
  });

  it("allows a server file to import it", () => {
    expect(checkSourceText("route.ts", 'import { createAdminClient } from "@/lib/db/admin";')).toEqual([]);
  });
});

// Issue #93: the command must run its checks wherever it is started from. A raw
// `file://` + path comparison skipped main() for a path with a space (or a symlink) and exited 0.
// Run from a folder with no build, the real check exits 1 and says so.
describe("check-client-secrets command", () => {
  const script = join(process.cwd(), "scripts", "check-client-secrets.mjs");

  function runFrom(kind: "space" | "symlink") {
    const dir = mkdtempSync(join(tmpdir(), "check client secrets "));
    try {
      const target = join(dir, kind === "space" ? "check-client-secrets.mjs" : "real.mjs");
      copyFileSync(script, target);
      let entry = target;
      if (kind === "symlink") {
        entry = join(dir, "link.mjs");
        symlinkSync(target, entry);
      }
      return spawnSync("node", [entry], { cwd: dir, encoding: "utf8" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it.each(["space", "symlink"] as const)("still runs its checks from a path with a %s", (kind) => {
    const result = runFrom(kind);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(".next/static not found");
  });
});
