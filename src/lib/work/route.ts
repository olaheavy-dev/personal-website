import type { Result } from "@/lib/db/result";
import type { DetailSource, FeatureFlags, Outcome, Stop, WorkFilter } from "@/lib/db/types";
import { stopEyebrow, type StopEyebrow } from "@/lib/stops/eyebrow";
import { caseStudyHref, caseStudyRegistry, type CaseStudyEntry } from "@/lib/flags/registry";
import type { Viewer } from "@/lib/flags/visibility";
import { deimosGroupHeading, deimosGroupParts } from "./deimos";

// What the /work page shows, worked out from the database rows and the flags. Pure: no reading,
// no rendering, so every rule and edge state is a plain unit test (issue #10, PR 1).

/** Where the owner was when a stop happened. Lagos until the 2024 move with HBK (owner, 27 Oct 2026: the Deimos years were remote from Lagos); HBK is in the UK. */
export type WorkEra = "lagos" | "uk";

/** The first stop number in the UK: HBK, stop 07. Every earlier stop is Lagos. One constant. */
export const ukFromStopNumber = 7;

/** The `?filter=` values and their chip labels, in chip order. */
export const workFilterOptions: readonly { param: WorkFilter; label: string }[] = [
  { param: "ai", label: "AI" },
  { param: "payments", label: "Payments & banking" },
  { param: "data-iot", label: "Data & IoT" },
  { param: "edtech", label: "Edtech" },
];

/** A `?filter=` value to a filter, or null (All) for anything else, including a repeated key. */
export function parseWorkFilter(value: string | readonly string[] | null | undefined): WorkFilter | null {
  const first = typeof value === "string" || value == null ? value : value[0];
  return workFilterOptions.find((option) => option.param === first)?.param ?? null;
}

export type WorkTicketModel = {
  slug: string;
  /** Stop number, 1 to 7. */
  number: number;
  /** Role over meta; a Deimos client has no role and the meta "via Deimos". */
  eyebrow: StopEyebrow;
  title: string;
  kind: Stop["kind"];
  /** Null when the stop has no summary: the ticket then shows no paragraph. */
  summary: string | null;
  /** At most four lines, trimmed, empty ones dropped. */
  details: string[];
  /** Public pages behind the detail lines, in order. Empty when there are none. */
  sources: DetailSource[];
  /** The stop's first outcome. Null when it has none: the ticket then shows no chip. */
  outcome: Outcome | null;
  /** The stop's areas, for the filter chips. */
  filters: WorkFilter[];
  /** The case study when it is live and visible, else null (no link). */
  href: `/work/${string}` | null;
  era: WorkEra;
  /** True while the stop is current (no end year). */
  current: boolean;
};

export type WorkRouteEntry =
  | { type: "stop"; ticket: WorkTicketModel }
  /** A consultancy and its client stops, newest first. The heading comes from the rows. */
  | {
      type: "group";
      via: string;
      heading: string;
      /** The Deimos job's role and years for the rail; null when the rows disagree. */
      role: string | null;
      years: string | null;
      tickets: WorkTicketModel[];
      /** The union of its tickets' areas: a filter hides the heading when none of them match. */
      filters: WorkFilter[];
    };

export type WorkChip = {
  /** Null is "All". */
  param: WorkFilter | null;
  label: string;
  href: "/work" | `/work?filter=${WorkFilter}`;
};

export type WorkRouteModel =
  | { unavailable: true }
  | {
      unavailable: false;
      /** Newest first. */
      entries: WorkRouteEntry[];
      /**
       * The move from the newest Lagos stop to the oldest UK stop (today Mukuru to HBK), for the
       * route's last leg. Null when either side was not read.
       */
      handover: { fromSlug: string; toSlug: string } | null;
      /** "All" plus an area only when at least one stop has it. */
      chips: WorkChip[];
    };

type Registries = {
  caseStudies?: readonly CaseStudyEntry[];
};

/**
 * A failed or empty read of the stops gives `unavailable`. Otherwise the stops come newest first
 * (stop number, highest first, whatever order they were read in). Stops that came through the
 * same consultancy (`via`) are one group entry, placed where its newest client would be.
 */
export function buildWorkRoute(
  stops: Result<Stop[]>,
  flags: FeatureFlags,
  viewer: Viewer,
  { caseStudies = caseStudyRegistry }: Registries = {},
): WorkRouteModel {
  if (!stops.ok || stops.data.length === 0) return { unavailable: true };

  const ordered = [...stops.data].sort((a, b) => b.number - a.number);

  const ticket = (stop: Stop): WorkTicketModel => ({
    slug: stop.slug,
    number: stop.number,
    eyebrow: stopEyebrow(stop),
    title: stop.name,
    kind: stop.kind,
    summary: stop.summary?.trim() ? stop.summary : null,
    details: stop.details
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4),
    sources: stop.detailSources.map(({ label, url }) => ({ label, url })),
    outcome: stop.outcomes[0] ?? null,
    filters: [...stop.filters],
    href: caseStudyHref(
      caseStudies.find((entry) => entry.stopSlug === stop.slug),
      flags,
      viewer,
    ),
    era: stop.number >= ukFromStopNumber ? "uk" : "lagos",
    current: stop.endYear === null,
  });

  const entries: WorkRouteEntry[] = [];
  const groups = new Map<string, Extract<WorkRouteEntry, { type: "group" }>>();
  const rowsByVia = new Map<string, Stop[]>();
  for (const stop of ordered) {
    if (!stop.via) {
      entries.push({ type: "stop", ticket: ticket(stop) });
      continue;
    }
    const rows = rowsByVia.get(stop.via) ?? [];
    rows.push(stop);
    rowsByVia.set(stop.via, rows);
    let group = groups.get(stop.via);
    if (!group) {
      group = {
        type: "group",
        via: stop.via,
        heading: "",
        role: null,
        years: null,
        tickets: [],
        filters: [],
      };
      groups.set(stop.via, group);
      entries.push(group);
    }
    group.tickets.push(ticket(stop));
  }
  for (const [via, group] of groups) {
    const rows = rowsByVia.get(via)!;
    group.heading = deimosGroupHeading(rows);
    ({ role: group.role, years: group.years } = deimosGroupParts(rows));
    group.filters = workFilterOptions
      .map((option) => option.param)
      .filter((param) => group.tickets.some((ticket) => ticket.filters.includes(param)));
  }

  const tickets = entries.flatMap((entry) => (entry.type === "stop" ? [entry.ticket] : entry.tickets));
  const lastLagos = tickets.find((candidate) => candidate.era === "lagos");
  const firstUk = [...tickets].reverse().find((candidate) => candidate.era === "uk");
  const handover = lastLagos && firstUk ? { fromSlug: lastLagos.slug, toSlug: firstUk.slug } : null;

  const present = new Set(ordered.flatMap((stop) => stop.filters));
  const chips: WorkChip[] = [
    { param: null, label: "All", href: "/work" },
    ...workFilterOptions
      .filter((option) => present.has(option.param))
      .map((option) => ({
        param: option.param,
        label: option.label,
        href: `/work?filter=${option.param}` as const,
      })),
  ];

  return {
    unavailable: false,
    entries,
    handover,
    chips,
  };
}
