import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readServerEnv, type ServerEnv } from "./env";
import { success, type Result } from "./result";
import type { DbClient } from "./public-client";

/**
 * A client that uses the secret key: it bypasses row level security and can write.
 * Server only. ESLint limits who may import this file (src/lib/db, src/app/api and
 * scripts), `scripts/check-client-secrets.mjs` checks the browser bundle, and this
 * function refuses to run where a `window` exists.
 */
export function createAdminClient(env: Result<ServerEnv> | null = null): Result<DbClient> {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must never run in the browser.");
  }
  const resolved = env ?? readServerEnv();
  if (!resolved.ok) return resolved;
  return success(
    createClient<Database>(resolved.data.url, resolved.data.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  );
}
