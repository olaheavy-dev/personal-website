import { cacheLife, cacheTag } from "next/cache";
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

export async function getFeatureFlags(): Promise<Result<FeatureFlags>> {
  "use cache";
  cacheTag(tags.flags);
  const client = createPublicClient();
  const result = client.ok ? await loadFlags(client.data) : client;
  if (result.ok) cacheLife("days");
  else cacheLife("minutes");
  return result;
}

/** True only for a flag that is on. A failed read or a missing key is off. */
export function isFlagOn(flags: Result<FeatureFlags>, key: string): boolean {
  return flags.ok && flags.data[key] === "on";
}
