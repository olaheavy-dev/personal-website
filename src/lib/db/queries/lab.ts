import { cacheLife, cacheTag } from "next/cache";
import { mapLabProject } from "../mappers";
import { createPublicClient, type DbClient } from "../public-client";
import { attempt, failure, success, type Result } from "../result";
import { tags } from "../tags";
import type { LabProject } from "../types";

/** The published lab projects with their sourced outcomes, in display order. */
export async function loadLabProjects(client: DbClient): Promise<Result<LabProject[]>> {
  return attempt(async () => {
    const { data, error } = await client.from("lab_projects").select("*, outcomes(*)").order("position");
    if (error) return failure("query_failed", error.message);
    const projects: LabProject[] = [];
    for (const row of data) {
      const project = mapLabProject(row);
      if (!project.ok) return project;
      projects.push(project.data);
    }
    return success(projects);
  });
}

export async function getLabProjects(): Promise<Result<LabProject[]>> {
  "use cache";
  cacheTag(tags.lab);
  const client = createPublicClient();
  const result = client.ok ? await loadLabProjects(client.data) : client;
  if (result.ok) cacheLife("days");
  else cacheLife("minutes");
  return result;
}
