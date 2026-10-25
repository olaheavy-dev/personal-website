import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readPublicEnv, type PublicEnv } from "./env";
import { success, type Result } from "./result";

export type DbClient = SupabaseClient<Database>;

/**
 * A client for the public read path: the publishable key, so row level security
 * decides what comes back (published rows only). It keeps no session and no timers.
 * Create one inside each function that needs it; do not share it at module scope.
 */
export function createPublicClient(env: Result<PublicEnv> = readPublicEnv()): Result<DbClient> {
  if (!env.ok) return env;
  return success(
    createClient<Database>(env.data.url, env.data.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  );
}
