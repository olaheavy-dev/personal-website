import type { Result } from "@/lib/db/result";
import type { FeatureFlags, LabProject, Outcome } from "@/lib/db/types";
import { pageRegistry, type PageEntry } from "@/lib/flags/registry";
import { isFlagVisible, type Viewer } from "@/lib/flags/visibility";

// What the home page's Lab and Latest writing two-up shows, worked out from the database rows
// and the flags. Pure: no reading, no rendering, so every state is a plain unit test.

/** The three Lab projects shown, in this order (information architecture). SabiTutor is not. */
export const labStripSlugs = ["foresight", "fastpilot", "homescout"] as const;

/**
 * The only figures the Lab strip may show (issue #9): each is a sourced outcome in the seed.
 * A project's first outcome shows only when its figure is the one listed here.
 */
export const labStripFigures: Readonly<Record<string, string>> = {
  foresight: "17",
  fastpilot: "0.992",
};

export type LabEvidenceLink = {
  kind: "github" | "live" | "demo" | "video";
  /** Visible text. */
  label: string;
  href: string;
};

export type LabMiniCardModel = {
  slug: string;
  name: string;
  /** Null when the project has no summary: the card then shows no paragraph. */
  summary: string | null;
  inProgress: boolean;
  links: LabEvidenceLink[];
  /** The sourced figure, or null when the project has none to show. */
  outcome: Outcome | null;
};

/** A Latest writing post. Settled in #14, which brings the posts; nothing fills it before. */
export type LatestPost = { slug: string; title: string; href: string };

export type HomeTwoUpModel = {
  /** Null when the Lab flag hides the strip, or when no project could be read. */
  lab: { cards: LabMiniCardModel[]; moreLink: "/lab" | null } | null;
  /** Null when the Writing flag hides it, or when there are no posts. */
  writing: { posts: LatestPost[]; moreLink: "/writing" | null } | null;
};

function evidenceLinks(project: LabProject): LabEvidenceLink[] {
  const links: LabEvidenceLink[] = [];
  const add = (kind: LabEvidenceLink["kind"], label: string, href: string | null) => {
    if (href) links.push({ kind, label, href });
  };
  add("github", "GitHub", project.repoUrl);
  add("live", "Try it", project.liveUrl);
  add("demo", "Demo", project.demoUrl);
  add("video", "Demo video", project.videoUrl);
  return links;
}

type Registry = readonly PageEntry[];

function pageEntry(pages: Registry, flag: PageEntry["flag"]) {
  return pages.find((page) => page.flag === flag);
}

/**
 * A failed read, an empty answer or none of the three projects gives no Lab half (null); a
 * partial answer gives only the projects that were read, in the fixed order. The Lab half
 * needs its page flag visible, the Writing half needs its flag visible and at least one post.
 * "All Lab projects" and "All posts" links show only for a visible page that has shipped.
 */
export function buildHomeTwoUp(
  labProjects: Result<LabProject[]>,
  flags: FeatureFlags,
  viewer: Viewer,
  { posts = [], pages = pageRegistry }: { posts?: readonly LatestPost[]; pages?: Registry } = {},
): HomeTwoUpModel {
  const visible = (flag: PageEntry["flag"]) => isFlagVisible(flags, flag, viewer);
  const live = (flag: PageEntry["flag"]) => visible(flag) && pageEntry(pages, flag)?.status === "live";

  let lab: HomeTwoUpModel["lab"] = null;
  if (visible("page.lab") && labProjects.ok) {
    const cards: LabMiniCardModel[] = [];
    for (const slug of labStripSlugs) {
      const project = labProjects.data.find((candidate) => candidate.slug === slug);
      if (!project) continue;
      const first = project.outcomes[0];
      cards.push({
        slug,
        name: project.name,
        summary: project.summary?.trim() ? project.summary : null,
        inProgress: project.inProgress,
        links: evidenceLinks(project),
        outcome: first && labStripFigures[slug] === first.figure ? first : null,
      });
    }
    if (cards.length > 0) lab = { cards, moreLink: live("page.lab") ? "/lab" : null };
  }

  const writing =
    visible("page.writing") && posts.length > 0
      ? { posts: [...posts], moreLink: live("page.writing") ? ("/writing" as const) : null }
      : null;

  return { lab, writing };
}
