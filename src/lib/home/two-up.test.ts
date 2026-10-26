import { failure, success } from "@/lib/db/result";
import type { FeatureFlags, LabProject, Outcome } from "@/lib/db/types";
import { buildHomeTwoUp, labStripSlugs, type LatestPost } from "./two-up";

const outcome = (figure: string, url = "https://github.com/olaheavy-dev/Foresight"): Outcome => ({
  id: `o-${figure}`,
  figure,
  description: "things counted",
  source: { kind: "link", label: "Repository README", url },
  checkedOn: "2026-10-25",
  scope: "personal",
  attribution: null,
  asOfYear: null,
});

function project(slug: string, position: number, more: Partial<LabProject> = {}): LabProject {
  return {
    id: slug,
    slug,
    name: slug.toUpperCase(),
    summary: `About ${slug}.`,
    inProgress: false,
    repoUrl: `https://github.com/example/${slug}`,
    liveUrl: null,
    demoUrl: null,
    videoUrl: null,
    writeupUrl: null,
    caseStudyId: null,
    position,
    outcomes: [],
    ...more,
  };
}

const fastpilotUrl = "https://github.com/olaheavy-dev/fastpilot";
const foresight = project("foresight", 1, {
  liveUrl: "https://foresight.example",
  outcomes: [outcome("17")],
});
const fastpilot = project("fastpilot", 2, {
  videoUrl: "https://loom.example/x",
  outcomes: [outcome("~210", fastpilotUrl), outcome("0.992", fastpilotUrl)],
});
const homescout = project("homescout", 3, { inProgress: true });
const sabitutor = project("sabitutor", 4, { inProgress: true, repoUrl: null });
const all = [sabitutor, homescout, fastpilot, foresight];

const on = (...keys: string[]): FeatureFlags => Object.fromEntries(keys.map((key) => [key, "on" as const]));
const post: LatestPost = { slug: "a", title: "A post", href: "/writing/a" };

describe("buildHomeTwoUp", () => {
  it("shows Foresight, FastPilot and HomeScout in that order, never SabiTutor", () => {
    const model = buildHomeTwoUp(success(all), on("page.lab"), "public");
    expect(model.lab!.cards.map((card) => card.slug)).toEqual([...labStripSlugs]);
    expect(model.lab!.cards.map((card) => card.slug)).not.toContain("sabitutor");
  });

  it("lists the evidence that is present: repo, live, demo and video, in that order", () => {
    const full = project("foresight", 1, {
      liveUrl: "https://a.example",
      demoUrl: "https://b.example",
      videoUrl: "https://c.example",
    });
    const model = buildHomeTwoUp(success([full, fastpilot, homescout]), on("page.lab"), "public");
    expect(model.lab!.cards[0]!.links.map((link) => link.label)).toEqual([
      "GitHub",
      "Try it",
      "Demo",
      "Demo video",
    ]);
    expect(model.lab!.cards[1]!.links.map((link) => link.label)).toEqual(["GitHub", "Demo video"]);
  });

  it("shows no 'Try it' without a live URL and no links at all without any evidence", () => {
    const bare = project("homescout", 3, { repoUrl: null });
    const model = buildHomeTwoUp(success([bare]), on("page.lab"), "public");
    expect(model.lab!.cards[0]!.links).toEqual([]);
  });

  it("marks only HomeScout in progress", () => {
    const model = buildHomeTwoUp(success(all), on("page.lab"), "public");
    expect(model.lab!.cards.map((card) => card.inProgress)).toEqual([false, false, true]);
  });

  it("shows only the Foresight 17 and FastPilot 0.992 figures, never a second FastPilot figure", () => {
    const model = buildHomeTwoUp(success(all), on("page.lab"), "public");
    expect(model.lab!.cards.map((card) => card.outcome?.figure ?? null)).toEqual(["17", "0.992", null]);
  });

  it("finds the approved outcome wherever it sits, and drops one with the right figure and another source", () => {
    const wrongSource = project("foresight", 1, {
      outcomes: [outcome("17", "https://example.com/elsewhere")],
    });
    expect(
      buildHomeTwoUp(success([wrongSource]), on("page.lab"), "public").lab!.cards[0]!.outcome,
    ).toBeNull();
    const second = buildHomeTwoUp(success([fastpilot]), on("page.lab"), "public");
    expect(second.lab!.cards[0]!.outcome?.figure).toBe("0.992");
  });

  it("drops a figure that is not the approved one", () => {
    const changed = project("foresight", 1, { outcomes: [outcome("18")] });
    const model = buildHomeTwoUp(success([changed]), on("page.lab"), "public");
    expect(model.lab!.cards[0]!.outcome).toBeNull();
  });

  it("omits the paragraph when there is no summary", () => {
    const model = buildHomeTwoUp(
      success([project("foresight", 1, { summary: "  " })]),
      on("page.lab"),
      "public",
    );
    expect(model.lab!.cards[0]!.summary).toBeNull();
  });

  it("gives only the projects that were read when the answer is partial", () => {
    const model = buildHomeTwoUp(success([homescout, foresight]), on("page.lab"), "public");
    expect(model.lab!.cards.map((card) => card.slug)).toEqual(["foresight", "homescout"]);
  });

  it("gives no Lab half for a failed read, an empty answer or only unlisted projects", () => {
    const flags = on("page.lab");
    expect(buildHomeTwoUp(failure("query_failed", "down"), flags, "public").lab).toBeNull();
    expect(buildHomeTwoUp(success([]), flags, "public").lab).toBeNull();
    expect(buildHomeTwoUp(success([sabitutor]), flags, "public").lab).toBeNull();
  });

  it("hides the Lab half when its flag is off, missing or Preview for the public", () => {
    expect(buildHomeTwoUp(success(all), {}, "public").lab).toBeNull();
    expect(buildHomeTwoUp(success(all), { "page.lab": "off" }, "public").lab).toBeNull();
    expect(buildHomeTwoUp(success(all), { "page.lab": "preview" }, "public").lab).toBeNull();
    expect(buildHomeTwoUp(success(all), { "page.lab": "preview" }, "owner").lab).not.toBeNull();
  });

  it("renders no Writing half while there are no posts, even with its flag on", () => {
    const model = buildHomeTwoUp(success(all), on("page.lab", "page.writing"), "public");
    expect(model.writing).toBeNull();
    expect(model.lab).not.toBeNull();
  });

  it("shows the Writing half only with posts and its flag", () => {
    const flags = on("page.lab", "page.writing");
    expect(buildHomeTwoUp(success(all), flags, "public", { posts: [post] }).writing!.posts).toEqual([post]);
    expect(buildHomeTwoUp(success(all), on("page.lab"), "public", { posts: [post] }).writing).toBeNull();
  });

  it("links to a page while its flag is visible, the same rule as 'See the whole route'", () => {
    const flags = on("page.lab", "page.writing");
    const model = buildHomeTwoUp(success(all), flags, "public", { posts: [post] });
    expect(model.lab!.moreLink).toBe("/lab");
    expect(model.writing!.moreLink).toBe("/writing");
    const owner = buildHomeTwoUp(success(all), { "page.lab": "preview" }, "owner");
    expect(owner.lab!.moreLink).toBe("/lab");
  });
});
