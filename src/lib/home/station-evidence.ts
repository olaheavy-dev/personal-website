import type { FeatureFlags, SectionAnchor } from "@/lib/db/types";
import { caseStudyHref, caseStudyRegistry, type CaseStudyEntry } from "@/lib/flags/registry";
import type { Viewer } from "@/lib/flags/visibility";

// Each Journey station links to the evidence for it: a section of a case study (information
// architecture, Home section 3). A link appears only when that case study is live and its
// flag is visible, so today none appears. The pairing is the plan's working choice and can
// change with the case study copy; the gating is what matters.

export type StationName = "Idea" | "Design" | "Build" | "Ship" | "Scale";

export type StationEvidence = { caseStudy: string; anchor: SectionAnchor };

export const stationEvidence: Record<StationName, StationEvidence> = {
  Idea: { caseStudy: "hbk-aiana", anchor: "context" },
  Design: { caseStudy: "hbk-aiana", anchor: "design" },
  Build: { caseStudy: "optty", anchor: "architecture" },
  Ship: { caseStudy: "access-bank", anchor: "production" },
  Scale: { caseStudy: "hbk-aiana", anchor: "results" },
};

/** The link for a station, or null while its case study is not live and visible. */
export function stationEvidenceHref(
  station: StationName,
  flags: FeatureFlags,
  viewer: Viewer,
  caseStudies: readonly CaseStudyEntry[] = caseStudyRegistry,
): string | null {
  const evidence = stationEvidence[station];
  const entry = caseStudies.find((candidate) => candidate.slug === evidence.caseStudy);
  const href = caseStudyHref(entry, flags, viewer);
  return href ? `${href}#${evidence.anchor}` : null;
}
