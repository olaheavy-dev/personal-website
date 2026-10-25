import { cacheLife, cacheTag } from "next/cache";
import { mapStop } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, success, type Result } from "../result";
import { tags } from "../tags";
import type { Stop } from "../types";

/** The published stops with their sourced outcomes, oldest first (stop 01 first). */
export async function loadStops(client: DbClient): Promise<Result<Stop[]>> {
  return attempt(async () => {
    const { data, error } = await client.from("stops").select("*, outcomes(*)").order("number");
    if (error) return failure("query_failed", error.message);
    const stops: Stop[] = [];
    for (const row of data) {
      const stop = mapStop(row);
      if (!stop.ok) return stop;
      stops.push(stop.data);
    }
    return success(stops);
  });
}

export async function getStops(): Promise<Result<Stop[]>> {
  "use cache";
  cacheTag(tags.stops);
  const client = createPublicClient();
  const result = client.ok ? await loadStops(client.data) : client;
  if (result.ok) cacheLife("days");
  else cacheLife("minutes");
  return result;
}
