import { cacheLife, cacheTag } from "next/cache";
import { mapCaseStudy } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, success, type Result } from "../result";
import { tags } from "../tags";
import type { CaseStudy } from "../types";

/** One published case study by slug, or `null` when there is none (draft or unknown). */
export async function loadCaseStudy(client: DbClient, slug: string): Promise<Result<CaseStudy | null>> {
  return attempt(async () => {
    const { data, error } = await client
      .from("case_studies")
      .select("*, case_study_sections(*), outcomes(*)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return failure("query_failed", error.message);
    if (!data) return success(null);
    return mapCaseStudy(data);
  });
}

// Callers validate the slug against ^[a-z0-9]+(-[a-z0-9]+)*$ first, so crawlers cannot fill the
// cache with entries for random slugs.
export async function getCaseStudy(slug: string): Promise<Result<CaseStudy | null>> {
  "use cache";
  cacheTag(tags.caseStudies, tags.caseStudy(slug));
  const client = createPublicClient();
  const result = client.ok ? await loadCaseStudy(client.data, slug) : client;
  // A missing study may be published soon, so it is checked again sooner.
  if (result.ok && result.data) cacheLife("days");
  else cacheLife("minutes");
  return result;
}
