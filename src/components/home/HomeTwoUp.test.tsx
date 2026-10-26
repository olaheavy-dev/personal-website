import { render, screen, within } from "@testing-library/react";
import { failure, success } from "@/lib/db/result";
import type { LabProject, Outcome } from "@/lib/db/types";
import { getFlags } from "@/lib/db/queries/flags";
import { getLabProjects } from "@/lib/db/queries/lab";
import { buildHomeTwoUp, type LatestPost } from "@/lib/home/two-up";
import { HomeTwoUp, HomeTwoUpView } from "./HomeTwoUp";

vi.mock("@/lib/db/queries/flags", () => ({ getFlags: vi.fn() }));
vi.mock("@/lib/db/queries/lab", () => ({ getLabProjects: vi.fn() }));

const outcome = (figure: string, description: string): Outcome => ({
  id: figure,
  figure,
  description,
  source: {
    kind: "link",
    label: "Foresight repository README",
    url: "https://github.com/olaheavy-dev/Foresight",
  },
  checkedOn: "2026-10-25",
  scope: "personal",
  attribution: null,
  asOfYear: null,
});

const project = (slug: string, position: number, more: Partial<LabProject> = {}): LabProject => ({
  id: slug,
  slug,
  name: slug[0]!.toUpperCase() + slug.slice(1),
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
});

const rows = [
  project("foresight", 1, {
    liveUrl: "https://foresight.example",
    outcomes: [outcome("17", "evaluation suites")],
  }),
  project("fastpilot", 2, { videoUrl: "https://loom.example/x" }),
  project("homescout", 3, { inProgress: true }),
];
const post: LatestPost = { slug: "a", title: "A first post", href: "/writing/a" };

function view(flags: Record<string, "on" | "off">, posts: LatestPost[] = []) {
  return render(<HomeTwoUpView model={buildHomeTwoUp(success(rows), flags, "public", { posts })} />);
}

describe("HomeTwoUpView", () => {
  it("shows three Lab cards as articles named by their headings, under one h2", () => {
    view({ "page.lab": "on" });
    const section = screen.getByRole("region", { name: "In the lab" });
    expect(
      within(section)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["Foresight", "Fastpilot", "Homescout"]);
    expect(within(section).getAllByRole("article")).toHaveLength(3);
  });

  it("gives every evidence link a name with its project and opens it in a new tab", () => {
    view({ "page.lab": "on" });
    const foresight = screen.getByRole("article", { name: "Foresight" });
    const names = within(foresight)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(names[0]).toContain("GitHub");
    expect(
      within(foresight).getByRole("link", { name: /^Try it \(Foresight, opens in a new tab\)/ }),
    ).toHaveAttribute("target", "_blank");
    expect(within(foresight).getByRole("link", { name: /source: / })).toHaveTextContent(
      "17 evaluation suites",
    );
  });

  it("tags only HomeScout In progress", () => {
    view({ "page.lab": "on" });
    expect(screen.getAllByText("In progress")).toHaveLength(1);
    expect(
      within(screen.getByRole("article", { name: "Homescout" })).getByText("In progress"),
    ).toBeInTheDocument();
  });

  it("puts In progress in HomeScout's stub, like a figure, and starts every card with its name", () => {
    view({ "page.lab": "on" });
    const scout = screen.getByRole("article", { name: "Homescout" });
    expect(scout.querySelector(".ticket-stub")).toHaveTextContent("In progress");
    expect(screen.queryByText(/^Project 0/)).toBeNull();
    for (const article of screen.getAllByRole("article")) {
      expect(article.querySelector(".ticket-body > h3")).not.toBeNull();
    }
  });

  it("links 'See the whole lab' to /lab while the page is visible", () => {
    view({ "page.lab": "on" });
    expect(screen.getByRole("link", { name: /See the whole lab/ })).toHaveAttribute("href", "/lab");
  });

  it("lets the Lab half span when Writing has no posts", () => {
    const { container } = view({ "page.lab": "on", "page.writing": "on" });
    expect(screen.queryByRole("region", { name: "Latest writing" })).toBeNull();
    expect(container.firstElementChild!.className).not.toContain("lg:grid-cols-2");
  });

  it("puts the halves side by side when both show", () => {
    const { container } = view({ "page.lab": "on", "page.writing": "on" }, [post]);
    expect(container.firstElementChild!.className).toContain("lg:grid-cols-2");
    expect(
      within(screen.getByRole("region", { name: "Latest writing" })).getByRole("link", {
        name: "A first post",
      }),
    ).toHaveAttribute("href", "/writing/a");
  });

  it("lets the Writing half span when Lab is hidden", () => {
    const { container } = view({ "page.writing": "on" }, [post]);
    expect(screen.queryByRole("region", { name: "In the lab" })).toBeNull();
    expect(screen.getByRole("region", { name: "Latest writing" })).toBeInTheDocument();
    expect(container.firstElementChild!.className).not.toContain("lg:grid-cols-2");
  });

  it("renders nothing, no wrapper, when both halves are hidden", () => {
    const { container } = view({});
    expect(container).toBeEmptyDOMElement();
  });
});

describe("HomeTwoUp", () => {
  it("reads the projects and flags, and shows nothing when the read fails", async () => {
    vi.mocked(getFlags).mockResolvedValue({ "page.lab": "on" });
    vi.mocked(getLabProjects).mockResolvedValue(failure("query_failed", "down"));
    const { container } = render(await HomeTwoUp());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the strip from the cached read", async () => {
    vi.mocked(getFlags).mockResolvedValue({ "page.lab": "on" });
    vi.mocked(getLabProjects).mockResolvedValue(success(rows));
    render(await HomeTwoUp());
    expect(screen.getByRole("region", { name: "In the lab" })).toBeInTheDocument();
  });
});
