import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: the variables must already be in the shell.
}

// `pnpm db:smoke`: reads the real project with the typed loaders. It needs the Supabase
// variables from .env.local (or the shell). Not part of `make check`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/lib/db/smoke/*.smoke.ts"],
  },
});
