import type { Result } from "@/lib/db/result";
import type { FeatureFlags, Outcome, Stop } from "@/lib/db/types";
import {
  caseStudyHref,
  caseStudyRegistry,
  pageRegistry,
  visiblePageHref,
  type CaseStudyEntry,
  type PageEntry,
} from "@/lib/flags/registry";
import { isFlagVisible, type Viewer } from "@/lib/flags/visibility";

// What the home page's Selected work section shows, worked out from the database rows and
// the flags. Pure: no reading, no rendering, so every state is a plain unit test.

/** The three stops shown, newest first (owner decision, 26 Oct 2026). */
export const selectedStopSlugs = ["mukuru", "optty", "access-bank"] as const;

export type SelectedTicket = {
  slug: string;
  /** Mono station label, for example "Senior Software Engineer · via Deimos · 2022 to 2024". */
  eyebrow: string;
  title: string;
  /** Null when the stop has no summary: the ticket then shows no paragraph. */
  summary: string | null;
  /** The stop's first outcome. Null when it has none: the ticket then shows no chip. */
  outcome: Outcome | null;
  /** The case study, else its place on /work, else nothing. */
  href: string | null;
};

export type SelectedStopsModel = {
  tickets: SelectedTicket[];
  /** "See all work" shows only while /work is visible. */
  routeLink: "/work" | null;
};

/**
 * The ticket's mono eyebrow, from the owner's CV: "Senior Software Engineer · via Deimos · 2022
 * to 2024" for a client stop of a consultancy, "Technical Support Engineer · 2016 to 2018"
 * otherwise, and "2024 to now" while the stop is current. A stop with no role shows the years
 * only.
 */
export function stopEyebrow(stop: Pick<Stop, "role" | "via" | "startYear" | "endYear">): string {
  const years = `${stop.startYear} to ${stop.endYear ?? "now"}`;
  if (!stop.role) return years;
  return [stop.role, ...(stop.via ? [`via ${stop.via}`] : []), years].join(" · ");
}

type Registries = {
  pages?: readonly PageEntry[];
  caseStudies?: readonly CaseStudyEntry[];
};

/**
 * A failed read, an empty answer or none of the three stops gives no section (null). A partial
 * answer gives only the stops that were read, in the fixed order. A link is the case study when
 * its flag is visible and it is live, else `/work#<slug>` when Work is visible and live, else
 * none (a flagged-off page is never linked, rule 7).
 */
export function buildSelectedStops(
  stops: Result<Stop[]>,
  flags: FeatureFlags,
  viewer: Viewer,
  { pages = pageRegistry, caseStudies = caseStudyRegistry }: Registries = {},
): SelectedStopsModel | null {
  if (!stops.ok) return null;

  const work = pages.find((page) => page.href === "/work");
  const workVisible = work !== undefined && isFlagVisible(flags, work.flag, viewer);
  const workLive = workVisible && work.status === "live";

  const tickets: SelectedTicket[] = [];
  for (const slug of selectedStopSlugs) {
    const stop = stops.data.find((candidate) => candidate.slug === slug);
    if (!stop) continue;
    const entry = caseStudies.find((candidate) => candidate.stopSlug === slug);
    tickets.push({
      slug,
      eyebrow: stopEyebrow(stop),
      title: stop.name,
      summary: stop.summary?.trim() ? stop.summary : null,
      outcome: stop.outcomes[0] ?? null,
      href: caseStudyHref(entry, flags, viewer) ?? (workLive ? `/work#${slug}` : null),
    });
  }
  if (tickets.length === 0) return null;
  return { tickets, routeLink: visiblePageHref("/work", flags, viewer, pages) };
}
