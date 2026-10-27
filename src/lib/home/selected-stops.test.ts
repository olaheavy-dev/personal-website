import { failure, success } from "@/lib/db/result";
import type { FeatureFlags, Outcome, Stop } from "@/lib/db/types";
import type { CaseStudyEntry, PageEntry } from "@/lib/flags/registry";
import { buildSelectedStops, stopEyebrow } from "./selected-stops";

const chip: Outcome = {
  id: "o1",
  figure: "90+",
  description: "methods",
  source: { kind: "link", label: "Source", url: "https://example.com" },
  checkedOn: "2026-10-25",
  scope: "company",
  attribution: "Optty",
  asOfYear: 2023,
};

function stop(slug: string, number: number, more: Partial<Stop> = {}): Stop {
  return {
    id: slug,
    slug,
    number,
    name: slug.toUpperCase(),
    kind: "flagship",
    filters: [],
    startYear: 2020,
    endYear: 2022,
    via: null,
    role: "Senior Software Engineer",
    summary: `About ${slug}.`,
    details: [],
    stack: [],
    outcomes: [chip],
    ...more,
  };
}

const access = stop("access-bank", 2);
const optty = stop("optty", 4, { name: "Optty", via: "Deimos", startYear: 2022, endYear: 2024 });
const hbk = stop("hbk", 7, {
  name: "HBK",
  role: "Backend Software Engineer",
  startYear: 2024,
  endYear: null,
});
const mukuru = stop("mukuru", 6, { name: "Mukuru", via: "Deimos", startYear: 2022, endYear: 2024 });
const all = [access, optty, hbk, mukuru];

const pagesLive: PageEntry[] = [{ flag: "page.work", href: "/work", label: "Work", status: "live" }];
const pagesSoon: PageEntry[] = [{ flag: "page.work", href: "/work", label: "Work", status: "coming-soon" }];
const caseLive: CaseStudyEntry[] = [
  { slug: "mukuru-case", flag: "case.mukuru-case", stopSlug: "mukuru", status: "live" },
  { slug: "optty", flag: "case.optty", stopSlug: "optty", status: "planned" },
];
const on = (...keys: string[]): FeatureFlags => Object.fromEntries(keys.map((key) => [key, "on" as const]));

describe("stopEyebrow", () => {
  it("is role over years, from the owner's CV", () => {
    expect(stopEyebrow(hbk)).toEqual({ role: "Backend Software Engineer", meta: "2024 to now" });
    expect(stopEyebrow(access)).toEqual({ role: "Senior Software Engineer", meta: "2020 to 2022" });
  });

  it("shows only 'via Deimos' for a Deimos client: no role and no years", () => {
    expect(stopEyebrow(optty)).toEqual({ role: null, meta: "via Deimos" });
    expect(stopEyebrow(mukuru)).toEqual({ role: null, meta: "via Deimos" });
  });

  it("keeps the role and years on the Deimos rows' data, only the label changes", () => {
    expect(optty.role).toBe("Senior Software Engineer");
    expect(optty.startYear).toBe(2022);
  });

  it("shows the years only when the stop has no role", () => {
    expect(stopEyebrow({ ...access, role: null })).toEqual({ role: null, meta: "2020 to 2022" });
  });
});

describe("buildSelectedStops", () => {
  it("shows Mukuru, Optty and Access Bank, and never HBK, newest first, whatever order they were read in", () => {
    const model = buildSelectedStops(success(all), {}, "public");
    expect(model?.tickets.map((ticket) => ticket.slug)).toEqual(["mukuru", "optty", "access-bank"]);
    expect(model?.tickets.at(0)).toMatchObject({
      eyebrow: { role: null, meta: "via Deimos" },
      summary: "About mukuru.",
      outcome: chip,
    });
  });

  it("shows nothing when the read failed, the answer is empty or holds none of the three", () => {
    expect(buildSelectedStops(failure("query_failed", "down"), on("page.work"), "public")).toBeNull();
    expect(buildSelectedStops(success([]), on("page.work"), "public")).toBeNull();
    expect(buildSelectedStops(success([hbk]), on("page.work"), "public")).toBeNull();
  });

  it("shows only the rows that were read when the answer is partial", () => {
    const model = buildSelectedStops(success([access, mukuru]), {}, "public");
    expect(model?.tickets.map((ticket) => ticket.slug)).toEqual(["mukuru", "access-bank"]);
  });

  it("drops the chip when there is no outcome and the paragraph when there is no summary", () => {
    const bare = [stop("mukuru", 6, { outcomes: [], summary: null }), stop("optty", 4, { summary: "   " })];
    const model = buildSelectedStops(success(bare), {}, "public");
    expect(model?.tickets.at(0)).toMatchObject({ outcome: null, summary: null });
    expect(model?.tickets.at(1)).toMatchObject({ outcome: chip, summary: null });
  });

  it("uses the first outcome", () => {
    const second: Outcome = { ...chip, id: "o2", figure: "9" };
    const model = buildSelectedStops(
      success([stop("mukuru", 6, { outcomes: [chip, second] })]),
      {},
      "public",
    );
    expect(model?.tickets.at(0)?.outcome?.id).toBe("o1");
  });

  describe("links", () => {
    const flags = on("page.work", "case.mukuru-case", "case.optty");
    const build = (f: FeatureFlags, pages: PageEntry[], caseStudies: CaseStudyEntry[] = caseLive) =>
      buildSelectedStops(success(all), f, "public", { pages, caseStudies }) ?? { tickets: [] };

    it("goes to the case study when its flag is visible and it is live", () => {
      const links = Object.fromEntries(build(flags, pagesLive).tickets.map((t) => [t.slug, t.href]));
      expect(links).toEqual({
        mukuru: "/work/mukuru-case",
        optty: "/work#optty",
        "access-bank": "/work#access-bank",
      });
    });

    it("falls back to the place on /work when the case study flag is off, and never links a planned case study", () => {
      const links = build(on("page.work"), pagesLive).tickets.map((t) => t.href);
      expect(links).toEqual(["/work#mukuru", "/work#optty", "/work#access-bank"]);
    });

    it("has no link at all when /work is not live yet, or its flag is off", () => {
      expect(build(flags, pagesSoon, []).tickets.map((t) => t.href)).toEqual([null, null, null]);
      expect(build({}, pagesLive, []).tickets.map((t) => t.href)).toEqual([null, null, null]);
      expect(build(on("page.work", "case.mukuru-case"), pagesSoon, caseLive).tickets.at(0)?.href).toBe(
        "/work/mukuru-case",
      );
    });

    it("treats Preview as Off for the public", () => {
      expect(build({ "page.work": "preview" }, pagesLive, []).tickets.map((t) => t.href)).toEqual([
        null,
        null,
        null,
      ]);
    });

    it("links today's real registries to nothing, because no case study and no Work page is live", () => {
      const model = buildSelectedStops(success(all), on("page.work", "case.mukuru-case"), "public");
      expect(model?.tickets.map((t) => t.href)).toEqual([null, null, null]);
    });
  });

  describe("See all work", () => {
    it("links /work only while the Work page is visible", () => {
      expect(buildSelectedStops(success(all), on("page.work"), "public")?.routeLink).toBe("/work");
      expect(buildSelectedStops(success(all), {}, "public")?.routeLink).toBeNull();
      expect(buildSelectedStops(success(all), { "page.work": "preview" }, "public")?.routeLink).toBeNull();
    });
  });
});
