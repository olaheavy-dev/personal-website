import type { FeatureFlags } from "@/lib/db/types";
import { isFlagVisible, type Viewer } from "./visibility";

// The one list of the site's flagged pages. The navigation, the 404's way back, the
// sitemap, and later the command palette and the assistant's citations all read it, so
// a page switched off disappears from every one of them together.

export type PageFlagKey = "page.work" | "page.lab" | "page.writing" | "page.travel" | "page.about";

export type PageEntry = {
  flag: PageFlagKey;
  href: `/${string}`;
  label: string;
  /** Whether the real page has shipped; until then the route shows a coming soon page. */
  status: "live" | "coming-soon";
};

/** In navigation order (information architecture). */
export const pageRegistry: readonly PageEntry[] = [
  { flag: "page.work", href: "/work", label: "Work", status: "coming-soon" },
  { flag: "page.lab", href: "/lab", label: "Lab", status: "coming-soon" },
  { flag: "page.writing", href: "/writing", label: "Writing", status: "coming-soon" },
  { flag: "page.travel", href: "/travel", label: "Travel", status: "coming-soon" },
  { flag: "page.about", href: "/about", label: "About", status: "coming-soon" },
];

/**
 * The link to a flagged page from a section of another page ("See the whole route", "See the
 * whole lab"): the page's href while its flag is visible to this viewer, otherwise nothing, so a
 * flagged-off page is never linked (rule 7). One rule for every such link.
 */
export function visiblePageHref<H extends PageEntry["href"]>(
  href: H,
  flags: FeatureFlags,
  viewer: Viewer,
  pages: readonly PageEntry[] = pageRegistry,
): H | null {
  const page = pages.find((entry) => entry.href === href);
  return page !== undefined && isFlagVisible(flags, page.flag, viewer) ? href : null;
}

/** The pages this viewer can see, in navigation order. */
export function visiblePages(flags: FeatureFlags, viewer: Viewer): PageEntry[] {
  return pageRegistry.filter((page) => isFlagVisible(flags, page.flag, viewer));
}

export type CaseStudyEntry = {
  /** The case study's own slug, which is its URL: `/work/<slug>`. */
  slug: string;
  flag: `case.${string}`;
  /** The stop it belongs to, when it belongs to one (Foresight is a Lab project). */
  stopSlug: string | null;
  /** "planned" until the real page has shipped. A link to a planned case study never appears. */
  status: "planned" | "live";
};

/**
 * The site's case studies (information architecture, "Case study" pages). Like `pageRegistry`,
 * one list for every place that links to a case study. None has shipped, so all are planned.
 */
export const caseStudyRegistry: readonly CaseStudyEntry[] = [
  { slug: "hbk-aiana", flag: "case.hbk-aiana", stopSlug: "hbk", status: "planned" },
  { slug: "optty", flag: "case.optty", stopSlug: "optty", status: "planned" },
  { slug: "access-bank", flag: "case.access-bank", stopSlug: "access-bank", status: "planned" },
  { slug: "foresight", flag: "case.foresight", stopSlug: null, status: "planned" },
];

/** The URL of a case study this viewer can open: live, and its flag is visible. Otherwise null. */
export function caseStudyHref(
  entry: CaseStudyEntry | undefined,
  flags: FeatureFlags,
  viewer: Viewer,
): `/work/${string}` | null {
  if (!entry || entry.status !== "live" || !isFlagVisible(flags, entry.flag, viewer)) return null;
  return `/work/${entry.slug}`;
}
