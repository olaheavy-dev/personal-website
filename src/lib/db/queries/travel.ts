import { cacheLife, cacheTag } from "next/cache";
import { mapCountry } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, success, type Result } from "../result";
import { tags } from "../tags";
import type { Country } from "../types";

/** The published countries with their published trips; the home country is first. */
export async function loadCountries(client: DbClient): Promise<Result<Country[]>> {
  return attempt(async () => {
    const { data, error } = await client.from("countries").select("*, trips(*)").order("name");
    if (error) return failure("query_failed", error.message);
    const countries = data.map(mapCountry).sort((a, b) => Number(b.isHome) - Number(a.isHome));
    return success(countries);
  });
}

export async function getCountries(): Promise<Result<Country[]>> {
  "use cache";
  cacheTag(tags.travel);
  const client = createPublicClient();
  const result = client.ok ? await loadCountries(client.data) : client;
  if (result.ok) cacheLife("days");
  else cacheLife("minutes");
  return result;
}
