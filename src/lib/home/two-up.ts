import type { Result } from "@/lib/db/result";
import type { FeatureFlags, LabProject, Outcome } from "@/lib/db/types";
import { pageRegistry, visiblePageHref, type PageEntry } from "@/lib/flags/registry";
import { isFlagVisible, type Viewer } from "@/lib/flags/visibility";

// What the home page's Lab and Latest writing two-up shows, worked out from the database rows
// and the flags. Pure: no reading, no rendering, so every state is a plain unit test.

/** The three Lab projects shown, in this order (information architecture). SabiTutor is not. */
export const labStripSlugs = ["foresight", "fastpilot", "homescout"] as const;

/**
 * The only figures the Lab strip may show (issue #9): each is a sourced outcome in the seed. A
 * project shows the outcome whose figure and source link are both the ones listed here, wherever
 * it sits among the project's outcomes, and nothing otherwise.
 */
export const labStripFigures: Readonly<Record<string, { figure: string; sourceUrl: string }>> = {
  foresight: { figure: "17", sourceUrl: "https://github.com/olaheavy-dev/Foresight" },
  fastpilot: { figure: "0.992", sourceUrl: "https://github.com/olaheavy-dev/fastpilot" },
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

/**
 * A failed read, an empty answer or none of the three projects gives no Lab half (null); a
 * partial answer gives only the projects that were read, in the fixed order. The Lab half
 * needs its page flag visible, the Writing half needs its flag visible and at least one post.
 * The "See the whole lab" and "All writing" links follow the same rule as "See the whole route":
 * they show while the page is visible.
 */
export function buildHomeTwoUp(
  labProjects: Result<LabProject[]>,
  flags: FeatureFlags,
  viewer: Viewer,
  { posts = [], pages = pageRegistry }: { posts?: readonly LatestPost[]; pages?: Registry } = {},
): HomeTwoUpModel {
  const visible = (flag: PageEntry["flag"]) => isFlagVisible(flags, flag, viewer);

  let lab: HomeTwoUpModel["lab"] = null;
  if (visible("page.lab") && labProjects.ok) {
    const cards: LabMiniCardModel[] = [];
    for (const slug of labStripSlugs) {
      const project = labProjects.data.find((candidate) => candidate.slug === slug);
      if (!project) continue;
      const approved = labStripFigures[slug];
      const outcome = approved
        ? project.outcomes.find(
            (candidate) =>
              candidate.figure === approved.figure &&
              candidate.source.kind === "link" &&
              candidate.source.url === approved.sourceUrl,
          )
        : undefined;
      cards.push({
        slug,
        name: project.name,
        summary: project.summary?.trim() ? project.summary : null,
        inProgress: project.inProgress,
        links: evidenceLinks(project),
        outcome: outcome ?? null,
      });
    }
    if (cards.length > 0) lab = { cards, moreLink: visiblePageHref("/lab", flags, viewer, pages) };
  }

  const writing =
    visible("page.writing") && posts.length > 0
      ? { posts: [...posts], moreLink: visiblePageHref("/writing", flags, viewer, pages) }
      : null;

  return { lab, writing };
}
