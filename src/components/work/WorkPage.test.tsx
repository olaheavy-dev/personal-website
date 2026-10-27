import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { success } from "@/lib/db/result";
import type { FeatureFlags, LabProject, Outcome, Stop } from "@/lib/db/types";
import type { CaseStudyEntry, PageEntry } from "@/lib/flags/registry";
import { workCopy } from "@/lib/work/copy";
import { buildWorkRoute } from "@/lib/work/route";
import { WorkPageView } from "./WorkPage";

const outcome = (more: Partial<Outcome> = {}): Outcome => ({
  id: "o",
  figure: "1M+",
  description: "downloads of the QuickBucks app",
  source: { kind: "link", label: "Google Play listing", url: "https://play.google.com/example" },
  checkedOn: "2026-10-25",
  scope: "company",
  attribution: "Google Play",
  asOfYear: 2026,
  ...more,
});

const stop = (slug: string, number: number, more: Partial<Stop> = {}): Stop => ({
  id: slug,
  slug,
  number,
  name: slug[0]!.toUpperCase() + slug.slice(1),
  kind: "compact",
  filters: [],
  startYear: 2020,
  endYear: 2022,
  via: null,
  role: "Senior Software Engineer",
  summary: `Summary of ${slug}.`,
  details: [],
  stack: [],
  outcomes: [],
  ...more,
});

const deimos = { via: "Deimos", role: "Senior Software Engineer", startYear: 2022, endYear: 2024 } as const;
const stops = [
  stop("galooli", 1, {
    details: ["Deployed it.", "Built dashboards."],
    outcomes: [outcome({ figure: "~11%" })],
  }),
  stop("access", 2, { kind: "flagship", outcomes: [outcome()] }),
  stop("ulesson", 5, { ...deimos, details: ["Redesigned it."] }),
  stop("mukuru", 6, { ...deimos, details: ["Integrated wallets."] }),
  stop("bare", 3, { summary: null }),
  stop("hbk", 7, { kind: "flagship", endYear: null, startYear: 2024, outcomes: [] }),
];

const project: LabProject = {
  id: "f",
  slug: "foresight",
  name: "Foresight",
  summary: "A finance workspace.",
  inProgress: false,
  repoUrl: "https://github.com/olaheavy-dev/Foresight",
  liveUrl: null,
  demoUrl: null,
  videoUrl: null,
  writeupUrl: null,
  caseStudyId: null,
  position: 1,
  outcomes: [],
};
const pages: PageEntry[] = [{ flag: "page.lab", href: "/lab", label: "Lab", status: "live" }];
const noCases: CaseStudyEntry[] = [];
const model = (flags: FeatureFlags, rows = success(stops)) =>
  buildWorkRoute(rows, success([project]), flags, "public", { pages, caseStudies: noCases });

describe("WorkPageView", () => {
  it("has one h1 'Work' with the approved intro and no eyebrow", () => {
    render(<WorkPageView model={model({ "page.lab": "on" })} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Work$/);
    expect(screen.getByText(workCopy.intro)).toBeInTheDocument();
  });

  it("lists the stops newest first, Deimos clients under one heading", () => {
    render(<WorkPageView model={model({ "page.lab": "on" })} />);
    const list = screen.getByRole("region", { name: /Work, newest first/ });
    const headings = within(list)
      .getAllByRole("heading")
      .map((h) => `${h.tagName}:${h.textContent}`);
    expect(headings).toEqual([
      "H2:Hbk",
      "H2:Deimos · Senior Software Engineer · 2022 to 2024",
      "H3:Mukuru",
      "H3:Ulesson",
      "H2:Bare",
      "H2:Access",
      "H2:Galooli",
    ]);
    expect(list.querySelector("li#mukuru")).not.toBeNull();
    expect(within(list).getAllByText("via Deimos")).toHaveLength(2);
  });

  it("links no ticket title while no case study is live, and a stop without a summary shows none", () => {
    render(<WorkPageView model={model({ "page.lab": "on" })} />);
    const list = screen.getByRole("region", { name: /Work, newest first/ });
    expect(within(list).queryByRole("link", { name: "Hbk" })).toBeNull();
    expect(within(list).queryByText(/Summary of bare/)).toBeNull();
  });

  it("gives a flagship its figure as a source link, and a compact one expands to details and outcome", async () => {
    const user = userEvent.setup();
    render(<WorkPageView model={model({ "page.lab": "on" })} />);
    expect(screen.getAllByRole("link", { name: /\(source: Google Play listing/ })).toHaveLength(2);
    const button = screen.getByRole("button", { name: "Read more about Galooli" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(screen.getByRole("button", { name: "Show less about Galooli" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Deployed it.")).toBeInTheDocument();
  });

  it("shows the Lab band with its link while Lab is visible, and no band at all when it is not", () => {
    const { rerender } = render(<WorkPageView model={model({ "page.lab": "on" })} />);
    const band = screen.getByRole("region", { name: "In the lab" });
    expect(within(band).getByText(workCopy.lab.line)).toBeInTheDocument();
    expect(within(band).getByRole("heading", { level: 3, name: "Foresight" })).toBeInTheDocument();
    expect(within(band).getByRole("link", { name: /See the whole lab/ })).toHaveAttribute("href", "/lab");
    rerender(<WorkPageView model={model({})} />);
    expect(screen.queryByRole("region", { name: "In the lab" })).toBeNull();
    expect(screen.queryByText("Foresight")).toBeNull();
  });

  it("shows the header and one calm sentence with a home link when the stops are unavailable", () => {
    render(
      <WorkPageView
        model={model({ "page.lab": "on" }, {
          ok: false,
          error: { code: "query_failed", message: "x" },
        } as never)}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" &&
          el.textContent === "The work list isn't loading right now. The highlights are on the home page.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "the home page" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("region", { name: /newest first/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "In the lab" })).toBeNull();
  });

  it("shows the same calm sentence when the read was empty", () => {
    render(<WorkPageView model={model({}, success([]))} />);
    expect(screen.getByRole("link", { name: "the home page" })).toBeInTheDocument();
  });
});
