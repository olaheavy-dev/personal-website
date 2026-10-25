import { cacheLife, cacheTag } from "next/cache";
import { mapSettings } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, type Result } from "../result";
import { tags } from "../tags";
import type { SiteSettings } from "../types";

export async function loadSettings(client: DbClient): Promise<Result<SiteSettings>> {
  return attempt(async () => {
    const { data, error } = await client.from("settings").select("key, value");
    if (error) return failure("query_failed", error.message);
    return mapSettings(data);
  });
}

export async function getSettings(): Promise<Result<SiteSettings>> {
  "use cache";
  cacheTag(tags.settings);
  const client = createPublicClient();
  const result = client.ok ? await loadSettings(client.data) : client;
  if (result.ok) cacheLife("days");
  else cacheLife("minutes");
  return result;
}
