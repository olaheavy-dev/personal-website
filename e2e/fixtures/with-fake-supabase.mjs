// Runs a command with the fake Supabase server up and the Supabase build values pointing
// at it. `next build` reads the flags while it prerenders and writes NEXT_PUBLIC_* into
// the build, so the build and the tests must agree on one address. Used by `make build`
// and the CI visual job; the Docker image and the publish workflow use the real project.
//
//   node e2e/fixtures/with-fake-supabase.mjs pnpm build
import { spawn } from "node:child_process";
import { fakePort, fakePublishableKey, fakeUrl } from "./fake-constants.mjs";
import { startFakeSupabase } from "./fake-supabase.mjs";

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Usage: node e2e/fixtures/with-fake-supabase.mjs <command> [args]");
  process.exit(2);
}

// A fake already running on the port (a leftover, or `node e2e/fixtures/fake-supabase.mjs`) is
// reused. Anything else on that port is a mistake worth one clear line, not a stack trace.
let fake;
try {
  fake = await startFakeSupabase();
} catch (error) {
  if (error?.code !== "EADDRINUSE") throw error;
  const running = await fetch(`${fakeUrl}/__control`).then(
    (r) => r.ok,
    () => false,
  );
  if (!running) {
    console.error(
      `Port ${fakePort} is in use by something that is not the fake Supabase server. Stop it and retry.`,
    );
    process.exit(1);
  }
  console.log(`Reusing the fake Supabase server already running on port ${fakePort}.`);
}
const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: fakeUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fakePublishableKey,
  },
});
const code = await new Promise((resolve) =>
  child.on("exit", (exit, signal) => resolve(exit ?? (signal ? 1 : 0))),
);
await fake?.close();
process.exit(code);
