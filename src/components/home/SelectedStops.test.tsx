import { render, screen, within } from "@testing-library/react";
import { failure, success } from "@/lib/db/result";
import type { Outcome, Stop } from "@/lib/db/types";
import { getFlags } from "@/lib/db/queries/flags";
import { getStops } from "@/lib/db/queries/stops";
import { SelectedStops, SelectedStopsView } from "./SelectedStops";
import { buildSelectedStops } from "@/lib/home/selected-stops";

vi.mock("@/lib/db/queries/flags", () => ({ getFlags: vi.fn() }));
vi.mock("@/lib/db/queries/stops", () => ({ getStops: vi.fn() }));

const outcome = (more: Partial<Outcome>): Outcome => ({
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

const stop = (slug: string, number: number, more: Partial<Stop>): Stop => ({
  id: slug,
  slug,
  number,
  name: slug,
  kind: "flagship",
  filters: [],
  startYear: 2020,
  endYear: 2022,
  via: null,
  summary: `Summary of ${slug}.`,
  stack: [],
  outcomes: [],
  ...more,
});

const accessRow = stop("access-bank", 2, { name: "Access Bank", outcomes: [outcome({})] });
const opttyRow = stop("optty", 4, {
  name: "Optty",
  via: "Deimos",
  outcomes: [
    outcome({
      figure: "90+",
      description: "BNPL and local payment methods across 120+ countries",
      attribution: "Optty",
      asOfYear: 2023,
    }),
  ],
});
const mukuruRow = stop("mukuru", 6, {
  name: "Mukuru",
  via: "Deimos",
  outcomes: [
    outcome({
      figure: "17M+",
      description: "customers served",
      source: { kind: "link", label: "Techzim, 20 years of Mukuru", url: "https://techzim.co.zw/example" },
      attribution: "Mukuru",
      asOfYear: 2025,
    }),
  ],
});

const rows = [mukuruRow, opttyRow, accessRow];

function view(stops = rows, flags = {}) {
  const model = buildSelectedStops(success(stops), flags, "public");
  render(<SelectedStopsView model={model!} />);
  return screen.getByRole("region", { name: "Selected stops" });
}

describe("SelectedStopsView", () => {
  it("shows the three tickets in order, each as an article named by its heading", () => {
    const section = view();
    const tickets = within(section).getAllByRole("article");
    expect(tickets.map((ticket) => within(ticket).getByRole("heading", { level: 3 }).textContent)).toEqual([
      "Mukuru",
      "Optty",
      "Access Bank",
    ]);
    expect(section.querySelectorAll("h1")).toHaveLength(0);
  });

  it("labels each ticket with its stop, as the information architecture names them", () => {
    const section = view();
    expect(within(section).getByText("Stop 06 · via Deimos")).toBeInTheDocument();
    expect(within(section).getByText("Stop 04 · via Deimos")).toBeInTheDocument();
    expect(within(section).getByText("Stop 02")).toBeInTheDocument();
  });

  it("shows each summary and one chip with its attribution, no year, and the figure as the source link", () => {
    const section = view();
    const [mukuru, optty, access] = within(section).getAllByRole("article") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(mukuru).toHaveTextContent("Summary of mukuru.");
    expect(mukuru).toHaveTextContent("17M+ customers served");
    expect(mukuru).toHaveTextContent("(Mukuru)");
    expect(optty).toHaveTextContent("90+ BNPL and local payment methods across 120+ countries");
    expect(optty).toHaveTextContent("(Optty)");
    expect(optty).not.toHaveTextContent("2023");
    expect(access).toHaveTextContent("1M+ downloads of the QuickBucks app");
    expect(access).toHaveTextContent("(Google Play)");
    for (const ticket of [mukuru, optty, access]) {
      expect(within(ticket).getAllByRole("link", { name: /source: / })).toHaveLength(1);
    }
  });

  it("omits the chip without an outcome and the paragraph without a summary", () => {
    const section = view([stop("mukuru", 6, { name: "Mukuru", summary: null, outcomes: [] }), opttyRow]);
    const [mukuru, optty] = within(section).getAllByRole("article") as [HTMLElement, HTMLElement];
    expect(mukuru.querySelector("p.text-text-secondary")).toBeNull();
    expect(within(mukuru).queryByRole("link")).toBeNull();
    expect(optty).toHaveTextContent("Summary of optty.");
  });

  it("renders only the rows present when the answer is partial", () => {
    const section = view([mukuruRow]);
    expect(within(section).getAllByRole("article")).toHaveLength(1);
  });

  it("has no links while no case study is live and Work is not live, and no route link with Work off", () => {
    const section = view(rows, {});
    // Only the figures link, to their sources, in a new tab.
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) expect(link).toHaveAttribute("target", "_blank");
  });

  it("links 'See the whole route' to /work only while Work is visible", () => {
    const section = view(rows, { "page.work": "on" });
    const link = within(section).getByRole("link", { name: /See the whole route/ });
    expect(link).toHaveAttribute("href", "/work");
    expect(within(section).getAllByRole("link")).toHaveLength(4);
  });
});

describe("SelectedStops", () => {
  beforeEach(() => {
    vi.mocked(getFlags).mockResolvedValue({});
  });

  it("renders the section from the cached reads", async () => {
    vi.mocked(getStops).mockResolvedValue(success(rows));
    render(await SelectedStops());
    expect(screen.getByRole("region", { name: "Selected stops" })).toBeInTheDocument();
  });

  it("renders nothing when the read failed or came back empty", async () => {
    vi.mocked(getStops).mockResolvedValue(failure("query_failed", "down"));
    expect(await SelectedStops()).toBeNull();
    vi.mocked(getStops).mockResolvedValue(success([]));
    expect(await SelectedStops()).toBeNull();
  });
});
