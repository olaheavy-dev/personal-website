// Runs a command with the fake Supabase server up and the Supabase build values pointing
// at it. `next build` reads the flags while it prerenders and writes NEXT_PUBLIC_* into
// the build, so the build and the tests must agree on one address. Used by `make build`
// and the CI visual job; the Docker image and the publish workflow use the real project.
//
//   node e2e/fixtures/with-fake-supabase.mjs pnpm build
import { spawn } from "node:child_process";
import { fakePublishableKey, fakeUrl } from "./fake-constants.mjs";
import { startFakeSupabase } from "./fake-supabase.mjs";

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Usage: node e2e/fixtures/with-fake-supabase.mjs <command> [args]");
  process.exit(2);
}

const fake = await startFakeSupabase();
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
await fake.close();
process.exit(code);
