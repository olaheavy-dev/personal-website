// Proves that `next build` inlines the Supabase browser values, so a container that is
// started without them still reads them (the P0 in issue #6). It builds a tiny throwaway
// Next app in .artifacts/ that contains a copy of the real src/lib/db/env.ts, with dummy
// values, then starts its standalone server with those variables removed and asks it what
// the reader sees. A reader that looks names up dynamically fails this test.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "..");
const fixture = join(root, ".artifacts", "env-inlining");
const url = "https://abcdefghijklmnopqrst.supabase.co";
const key = "sb_publishable_dummyvalueforthetest";
const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"];

function cleanEnv(extra: Record<string, string> = {}) {
  const env: Record<string, string | undefined> = { ...process.env };
  delete env.NODE_ENV;
  for (const name of names) delete env[name];
  return { ...env, NEXT_TELEMETRY_DISABLED: "1", ...extra } as NodeJS.ProcessEnv;
}

function writeFixture() {
  rmSync(fixture, { recursive: true, force: true });
  mkdirSync(join(fixture, "app", "env"), { recursive: true });
  mkdirSync(join(fixture, "lib"), { recursive: true });
  cpSync(join(root, "src/lib/db/env.ts"), join(fixture, "lib/env.ts"));
  cpSync(join(root, "src/lib/db/result.ts"), join(fixture, "lib/result.ts"));
  symlinkSync(join(root, "node_modules"), join(fixture, "node_modules"));
  writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "env-inlining", private: true }));
  writeFileSync(
    join(fixture, "next.config.mjs"),
    `export default { output: "standalone", turbopack: { root: ${JSON.stringify(root)} } };\n`,
  );
  writeFileSync(
    join(fixture, "app/layout.tsx"),
    "export default function L({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n",
  );
  writeFileSync(
    join(fixture, "app/env/route.ts"),
    `import { readPublicEnv, readServerEnv } from "../../lib/env";
export const dynamic = "force-dynamic";
export function GET() {
  const pub = readPublicEnv();
  const server = readServerEnv();
  return Response.json({
    publicOk: pub.ok,
    urlMatches: pub.ok && pub.data.url === ${JSON.stringify(url)},
    keyMatches: pub.ok && pub.data.publishableKey === ${JSON.stringify(key)},
    serverReason: server.ok === false ? server.reason : "ok",
  });
}
`,
  );
}

async function ask(port: number) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/env`);
      if (response.ok) return await response.json();
    } catch {
      // not listening yet
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error("the standalone server never answered");
}

describe("build time Supabase values", () => {
  it("are inlined by next build, so a server started without them still sees them", async () => {
    writeFixture();
    const build = spawnSync("node", [join(root, "node_modules/next/dist/bin/next"), "build"], {
      cwd: fixture,
      env: cleanEnv({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }),
      encoding: "utf8",
    });
    expect(build.status, build.stdout + build.stderr).toBe(0);

    const port = 4300 + Math.floor(Math.random() * 500);
    // The build root is the repository, so the standalone server sits at the fixture's path inside it.
    const standalone = join(fixture, ".next/standalone");
    const nested = join(standalone, ".artifacts", "env-inlining");
    const home = existsSync(join(nested, "server.js")) ? nested : standalone;
    const server = spawn("node", [join(home, "server.js")], {
      cwd: home,
      env: cleanEnv({ PORT: String(port), HOSTNAME: "127.0.0.1" }),
      stdio: "ignore",
    });
    try {
      const seen = await ask(port);
      expect(seen.publicOk).toBe(true);
      expect(seen.urlMatches).toBe(true);
      expect(seen.keyMatches).toBe(true);
      // The secret key is never inlined: without it at runtime the server env is unconfigured.
      expect(seen.serverReason).toBe("unconfigured");
    } finally {
      server.kill();
      rmSync(fixture, { recursive: true, force: true });
    }
  }, 240_000);
});
