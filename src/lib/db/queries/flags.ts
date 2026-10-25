import { cacheLife, cacheTag } from "next/cache";
import { readPublicEnv } from "../env";
import { mapFlags } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, success, type Result } from "../result";
import { tags } from "../tags";
import type { FeatureFlags } from "../types";

/** The public role only sees flags that are on; a missing key means off. */
export async function loadFlags(client: DbClient): Promise<Result<FeatureFlags>> {
  return attempt(async () => {
    const { data, error } = await client.from("feature_flags").select("key, state");
    if (error) return failure("query_failed", error.message);
    return success(mapFlags(data));
  });
}

// The last flags this process read successfully. A page that is rebuilt while Supabase is
// down is rebuilt from these, so a short outage keeps the site as it was instead of hiding
// every page or turning them into errors (decision 0018). Kept on globalThis because the
// pages, the layout and the sitemap run in separate bundles that must share one copy.
const memory = globalThis as typeof globalThis & { __lastGoodFlags?: FeatureFlags };

/** Used by tests, so one test's flags never leak into the next. */
export function forgetLastGoodFlags() {
  delete memory.__lastGoodFlags;
}

/**
 * The flags every page and the navigation are built from (decision 0018).
 *
 * A failed read never means "every flag is off". When Supabase is configured and the read
 * fails:
 *  - if this process has read the flags before, the last good flags are returned and the
 *    answer is cached for a minute, so the rebuild keeps the pages as they were and is
 *    tried again soon;
 *  - otherwise it throws, which fails `next build` instead of baking in a site where every
 *    page is hidden, and leaves an already built page as it is.
 * It returns an empty map (everything off) only when Supabase is not configured at all,
 * which is the case in local development and unit tests without the variables.
 *
 * Cached for an hour as a backstop; the Supabase Database Webhook calls /api/revalidate
 * for an immediate refresh (docs/database.md). Errors are not cached.
 */
export async function getFlags(): Promise<FeatureFlags> {
  "use cache";
  cacheTag(tags.flags);
  const env = readPublicEnv();
  if (!env.ok && env.reason === "unconfigured") {
    cacheLife("hours");
    return {};
  }
  const client = createPublicClient(env);
  const result = client.ok ? await loadFlags(client.data) : client;
  if (result.ok) {
    memory.__lastGoodFlags = result.data;
    cacheLife("hours");
    return result.data;
  }
  if (memory.__lastGoodFlags) {
    cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
    return memory.__lastGoodFlags;
  }
  throw new Error(`Feature flags cannot be read: ${result.message}`);
}
