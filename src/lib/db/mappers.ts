import { z } from "zod";
import type { Json } from "./database.types";
import { failure, success, type Result } from "./result";
import type {
  CaseStudy,
  CaseStudySection,
  Country,
  FeatureFlags,
  LabProject,
  Outcome,
  Row,
  SiteSettings,
  Stop,
  Trip,
  WorkFilter,
} from "./types";

// Turns database rows into the shapes in types.ts. A row that breaks the rules the
// constraints should already enforce comes back as an `invalid_data` failure.

const filterParam: Record<Row<"stops">["filters"][number], WorkFilter> = {
  ai: "ai",
  payments: "payments",
  data_iot: "data-iot",
  edtech: "edtech",
};

export function mapOutcome(row: Row<"outcomes">): Outcome | null {
  let source: Outcome["source"];
  if (row.source_kind === "link") {
    if (!row.source_url || !row.source_label) return null;
    source = { kind: "link", label: row.source_label, url: row.source_url };
  } else {
    if (!row.source_note) return null;
    source = { kind: "own", note: row.source_note };
  }
  return {
    id: row.id,
    figure: row.figure,
    description: row.description,
    source,
    checkedOn: row.checked_on,
    scope: row.claim_scope,
    attribution: row.attribution,
    asOfYear: row.as_of_year,
  };
}

function mapOutcomes(rows: Row<"outcomes">[]): Result<Outcome[]> {
  const outcomes: Outcome[] = [];
  for (const row of [...rows].sort((a, b) => a.position - b.position)) {
    const outcome = mapOutcome(row);
    if (!outcome) return failure("invalid_data", `Outcome ${row.id} has no usable source.`);
    outcomes.push(outcome);
  }
  return success(outcomes);
}

export function mapStop(row: Row<"stops"> & { outcomes: Row<"outcomes">[] }): Result<Stop> {
  const outcomes = mapOutcomes(row.outcomes);
  if (!outcomes.ok) return outcomes;
  return success({
    id: row.id,
    slug: row.slug,
    number: row.number,
    name: row.name,
    kind: row.kind,
    filters: row.filters.map((filter) => filterParam[filter]),
    startYear: row.start_year,
    endYear: row.end_year,
    via: row.via,
    role: row.role,
    summary: row.summary,
    stack: row.stack,
    outcomes: outcomes.data,
  });
}

export function mapCaseStudy(
  row: Row<"case_studies"> & {
    case_study_sections: Row<"case_study_sections">[];
    outcomes: Row<"outcomes">[];
  },
): Result<CaseStudy> {
  const outcomes = mapOutcomes(row.outcomes);
  if (!outcomes.ok) return outcomes;
  const sections: CaseStudySection[] = [...row.case_study_sections]
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      id: section.id,
      anchor: section.anchor,
      position: section.position,
      title: section.title,
      body: section.body,
    }));
  return success({
    id: row.id,
    slug: row.slug,
    title: row.title,
    tldr: row.tldr,
    stopId: row.stop_id,
    publishedAt: row.published_at,
    sections,
    outcomes: outcomes.data,
  });
}

export function mapLabProject(
  row: Row<"lab_projects"> & { outcomes: Row<"outcomes">[] },
): Result<LabProject> {
  const outcomes = mapOutcomes(row.outcomes);
  if (!outcomes.ok) return outcomes;
  return success({
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    inProgress: row.in_progress,
    repoUrl: row.repo_url,
    liveUrl: row.live_url,
    demoUrl: row.demo_url,
    videoUrl: row.video_url,
    writeupUrl: row.writeup_url,
    caseStudyId: row.case_study_id,
    position: row.position,
    outcomes: outcomes.data,
  });
}

export function mapCountry(row: Row<"countries"> & { trips: Row<"trips">[] }): Country {
  const trips: Trip[] = [...row.trips]
    .sort((a, b) => b.year - a.year)
    .map((trip) => ({ id: trip.id, slug: trip.slug, title: trip.title, year: trip.year }));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    iso2: row.iso2,
    isHome: row.is_home,
    visitedYear: row.visited_year,
    trips,
  };
}

export function mapFlags(rows: Pick<Row<"feature_flags">, "key" | "state">[]): FeatureFlags {
  return Object.fromEntries(rows.map((row) => [row.key, row.state]));
}

const profileSchema = z.object({ label: z.string(), url: z.string().nullable() });
const settingsSchema = z.object({
  "site.name": z.string(),
  "site.first_name": z.string(),
  "site.url": z.string(),
  "site.one_liner": z.string(),
  "site.description": z.string(),
  "site.availability": z.string(),
  "site.time_zone": z.string(),
  "site.time_zone_label": z.string(),
  "site.copyright_since": z.number(),
  "site.resume_url": z.string().nullable(),
  "profile.github": profileSchema,
  "profile.linkedin": profileSchema,
  "profile.hashnode": profileSchema,
  "profile.x": profileSchema,
});

export function mapSettings(rows: { key: string; value: Json }[]): Result<SiteSettings> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(rows.map((row) => [row.key, row.value])));
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    return failure("invalid_data", `Settings are missing or malformed: ${missing}`);
  }
  const s = parsed.data;
  return success({
    name: s["site.name"],
    firstName: s["site.first_name"],
    url: s["site.url"],
    oneLiner: s["site.one_liner"],
    description: s["site.description"],
    availability: s["site.availability"],
    timeZone: s["site.time_zone"],
    timeZoneLabel: s["site.time_zone_label"],
    copyrightSince: s["site.copyright_since"],
    resumeUrl: s["site.resume_url"],
    profiles: [
      { key: "github", ...s["profile.github"] },
      { key: "linkedin", ...s["profile.linkedin"] },
      { key: "hashnode", ...s["profile.hashnode"] },
      { key: "x", ...s["profile.x"] },
    ],
  });
}
