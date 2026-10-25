import type { MetricSource } from "@/components/ticket/SourceDisclosure";
import type { Database } from "./database.types";

// What the site works with, in camelCase and with the database details tidied away.
// Database rows are mapped into these in mappers.ts.

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];

export type FlagState = Database["public"]["Enums"]["flag_state"];
export type StopKind = Database["public"]["Enums"]["stop_kind"];
export type SectionAnchor = Database["public"]["Enums"]["section_anchor"];
export type ClaimScope = Database["public"]["Enums"]["claim_scope"];

/** The `?filter=` values on /work. The database spells data-iot as data_iot. */
export type WorkFilter = "ai" | "payments" | "data-iot" | "edtech";

export type Outcome = {
  id: string;
  figure: string;
  description: string;
  source: MetricSource;
  /** The day the source link was last opened, as YYYY-MM-DD. */
  checkedOn: string | null;
  scope: ClaimScope;
  /** Who said it, for company claims. */
  attribution: string | null;
  asOfYear: number | null;
};

export type Stop = {
  id: string;
  slug: string;
  number: number;
  name: string;
  kind: StopKind;
  filters: WorkFilter[];
  startYear: number;
  /** Null while the stop is current ("Now"). */
  endYear: number | null;
  /** The consultancy it was through, for example "Deimos". */
  via: string | null;
  summary: string | null;
  stack: string[];
  outcomes: Outcome[];
};

export type CaseStudySection = {
  id: string;
  anchor: SectionAnchor;
  position: number;
  title: string;
  body: string | null;
};

export type CaseStudy = {
  id: string;
  slug: string;
  title: string;
  tldr: string[];
  stopId: string | null;
  publishedAt: string | null;
  sections: CaseStudySection[];
  outcomes: Outcome[];
};

export type LabProject = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  inProgress: boolean;
  repoUrl: string | null;
  /** "Try it" shows only while this is set. */
  liveUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  writeupUrl: string | null;
  caseStudyId: string | null;
  position: number;
  outcomes: Outcome[];
};

export type Trip = { id: string; slug: string; title: string; year: number };

export type Country = {
  id: string;
  slug: string;
  name: string;
  iso2: string;
  isHome: boolean;
  visitedYear: number | null;
  trips: Trip[];
};

export type SiteSettings = {
  name: string;
  firstName: string;
  url: string;
  oneLiner: string;
  description: string;
  availability: string;
  timeZone: string;
  timeZoneLabel: string;
  copyrightSince: number;
  resumeUrl: string | null;
  profiles: { key: "github" | "linkedin" | "hashnode" | "x"; label: string; url: string | null }[];
};

/** Flags that are on. A key that is missing is off. */
export type FeatureFlags = Partial<Record<string, FlagState>>;
