import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Issue #93, same fault: started through a symlink, the fake Supabase server used to exit
// without starting (its direct-start check compared a raw path). It must print its address.
describe("fake Supabase server started directly", () => {
  it("starts when launched through a symlink in a folder with a space", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fake supabase "));
    const link = join(dir, "link.mjs");
    symlinkSync(join(process.cwd(), "e2e", "fixtures", "fake-supabase.mjs"), link);
    const child = spawn("node", [link], {
      stdio: ["ignore", "pipe", "pipe"],
      // Any free port, so the test passes while a real fake already runs on 54329.
      env: { ...process.env, FAKE_PORT: "0" },
    });
    try {
      const output = await new Promise<string>((resolve) => {
        let text = "";
        const done = () => resolve(text);
        child.stdout.on("data", (chunk) => {
          text += String(chunk);
          if (text.includes("fake supabase on")) done();
        });
        child.stderr.on("data", (chunk) => (text += String(chunk)));
        child.on("exit", done);
        setTimeout(done, 5000);
      });
      expect(output).toContain("fake supabase on");
    } finally {
      child.kill("SIGTERM");
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
