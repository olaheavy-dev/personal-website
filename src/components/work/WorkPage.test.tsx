import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { success } from "@/lib/db/result";
import type { FeatureFlags, Outcome, Stop } from "@/lib/db/types";
import type { CaseStudyEntry } from "@/lib/flags/registry";
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

const noCases: CaseStudyEntry[] = [];
const model = (rows = success(stops), flags: FeatureFlags = {}) =>
  buildWorkRoute(rows, flags, "public", { caseStudies: noCases });

describe("WorkPageView", () => {
  it("has one h1 'Work' with the approved intro and no eyebrow", () => {
    render(<WorkPageView model={model()} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Work$/);
    expect(screen.getByText(workCopy.intro)).toBeInTheDocument();
  });

  it("lists the stops newest first, Deimos clients under one heading", () => {
    render(<WorkPageView model={model()} />);
    const list = screen.getByRole("region", { name: /Work, newest first/ });
    const headings = within(list)
      .getAllByRole("heading")
      .map((h) => `${h.tagName}:${h.textContent}`);
    expect(headings).toEqual([
      "H2:Hbk",
      "H2:Deimos, Senior Software Engineer, 2022 to 2024",
      "H3:Mukuru",
      "H3:Ulesson",
      "H2:Bare",
      "H2:Access",
      "H2:Galooli",
    ]);
    expect(list.querySelector("li#mukuru")).not.toBeNull();
    expect(within(list).getAllByText("via Deimos")).toHaveLength(2);
  });

  it("gives each entry a rail with its years and role, and the Deimos entry its job and client count", () => {
    render(<WorkPageView model={model()} />);
    const entries = [...document.querySelectorAll("[data-work-entry]")];
    expect(entries.map((entry) => entry.getAttribute("data-work-entry"))).toEqual([
      "hbk",
      "Deimos",
      "bare",
      "access",
      "galooli",
    ]);
    const rail = (key: string) =>
      document.querySelector(`[data-work-entry="${key}"] [data-rail]`)!.textContent;
    expect(rail("hbk")).toBe("2024 to nowSenior Software Engineer");
    expect(rail("galooli")).toBe("2020 to 2022Senior Software Engineer");
    expect(rail("Deimos")).toBe("2022 to 2024Senior Software EngineerDeimos · 2 clients");
    // The rail text of the group is decoration: the sr-only heading is its name.
    expect(document.querySelector('[data-work-entry="Deimos"] [data-rail]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("uses one title size for every company, flagship or compact, and an eyebrow only on Deimos clients", () => {
    render(<WorkPageView model={model()} />);
    const titles = screen
      .getByRole("region", { name: /Work, newest first/ })
      .querySelectorAll(".ticket h2, .ticket h3");
    expect(titles).toHaveLength(6);
    for (const title of titles) expect(title.className).toContain("text-display-sm");
    const eyebrows = [...document.querySelectorAll(".ticket p.label-mono")].map((p) => p.textContent);
    expect(eyebrows).toEqual(["via Deimos", "via Deimos"]);
  });

  it("shows no Lab band and no link to /lab", () => {
    render(<WorkPageView model={model()} />);
    expect(screen.queryByText("In the lab")).toBeNull();
    expect(document.querySelector('a[href="/lab"]')).toBeNull();
  });

  it("links no ticket title while no case study is live, and a stop without a summary shows none", () => {
    render(<WorkPageView model={model()} />);
    const list = screen.getByRole("region", { name: /Work, newest first/ });
    expect(within(list).queryByRole("link", { name: "Hbk" })).toBeNull();
    expect(within(list).queryByText(/Summary of bare/)).toBeNull();
  });

  it("gives a flagship its figure as a source link, and a compact one expands to details and outcome", async () => {
    const user = userEvent.setup();
    render(<WorkPageView model={model()} />);
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

  it("shows the header and one calm sentence with a home link when the stops are unavailable", () => {
    render(
      <WorkPageView model={model({ ok: false, error: { code: "query_failed", message: "x" } } as never)} />,
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
  });

  it("shows the same calm sentence when the read was empty", () => {
    render(<WorkPageView model={model(success([]))} />);
    expect(screen.getByRole("link", { name: "the home page" })).toBeInTheDocument();
  });
});
