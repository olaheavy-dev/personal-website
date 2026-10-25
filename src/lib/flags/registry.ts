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

/** The pages this viewer can see, in navigation order. */
export function visiblePages(flags: FeatureFlags, viewer: Viewer): PageEntry[] {
  return pageRegistry.filter((page) => isFlagVisible(flags, page.flag, viewer));
}
