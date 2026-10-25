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
    summary: `About ${slug}.`,
    stack: [],
    outcomes: [chip],
    ...more,
  };
}

const access = stop("access-bank", 2);
const optty = stop("optty", 4, { name: "Optty", via: "Deimos" });
const hbk = stop("hbk", 7, { name: "HBK", endYear: null });
const mukuru = stop("mukuru", 6);
const all = [access, optty, hbk, mukuru];

const pagesLive: PageEntry[] = [{ flag: "page.work", href: "/work", label: "Work", status: "live" }];
const pagesSoon: PageEntry[] = [{ flag: "page.work", href: "/work", label: "Work", status: "coming-soon" }];
const caseLive: CaseStudyEntry[] = [
  { slug: "hbk-aiana", flag: "case.hbk-aiana", stopSlug: "hbk", status: "live" },
  { slug: "optty", flag: "case.optty", stopSlug: "optty", status: "planned" },
];
const on = (...keys: string[]): FeatureFlags => Object.fromEntries(keys.map((key) => [key, "on" as const]));

describe("stopEyebrow", () => {
  it("follows the information architecture naming", () => {
    expect(stopEyebrow(hbk)).toBe("Stop 07 · Now");
    expect(stopEyebrow(optty)).toBe("Stop 04 · Optty · via Deimos");
    expect(stopEyebrow(access)).toBe("Stop 02");
  });
});

describe("buildSelectedStops", () => {
  it("shows HBK, Optty and Access Bank, newest first, whatever order they were read in", () => {
    const model = buildSelectedStops(success(all), {}, "public");
    expect(model?.tickets.map((ticket) => ticket.slug)).toEqual(["hbk", "optty", "access-bank"]);
    expect(model?.tickets.at(0)).toMatchObject({
      eyebrow: "Stop 07 · Now",
      summary: "About hbk.",
      outcome: chip,
    });
  });

  it("shows nothing when the read failed, the answer is empty or holds none of the three", () => {
    expect(buildSelectedStops(failure("query_failed", "down"), on("page.work"), "public")).toBeNull();
    expect(buildSelectedStops(success([]), on("page.work"), "public")).toBeNull();
    expect(buildSelectedStops(success([mukuru]), on("page.work"), "public")).toBeNull();
  });

  it("shows only the rows that were read when the answer is partial", () => {
    const model = buildSelectedStops(success([access, hbk]), {}, "public");
    expect(model?.tickets.map((ticket) => ticket.slug)).toEqual(["hbk", "access-bank"]);
  });

  it("drops the chip when there is no outcome and the paragraph when there is no summary", () => {
    const bare = [stop("hbk", 7, { outcomes: [], summary: null }), stop("optty", 4, { summary: "   " })];
    const model = buildSelectedStops(success(bare), {}, "public");
    expect(model?.tickets.at(0)).toMatchObject({ outcome: null, summary: null });
    expect(model?.tickets.at(1)).toMatchObject({ outcome: chip, summary: null });
  });

  it("uses the first outcome", () => {
    const second: Outcome = { ...chip, id: "o2", figure: "9" };
    const model = buildSelectedStops(success([stop("hbk", 7, { outcomes: [chip, second] })]), {}, "public");
    expect(model?.tickets.at(0)?.outcome?.id).toBe("o1");
  });

  describe("links", () => {
    const flags = on("page.work", "case.hbk-aiana", "case.optty");
    const build = (f: FeatureFlags, pages: PageEntry[], caseStudies: CaseStudyEntry[] = caseLive) =>
      buildSelectedStops(success(all), f, "public", { pages, caseStudies }) ?? { tickets: [] };

    it("goes to the case study when its flag is visible and it is live", () => {
      const links = Object.fromEntries(build(flags, pagesLive).tickets.map((t) => [t.slug, t.href]));
      expect(links).toEqual({
        hbk: "/work/hbk-aiana",
        optty: "/work#optty",
        "access-bank": "/work#access-bank",
      });
    });

    it("falls back to the place on /work when the case study flag is off, and never links a planned case study", () => {
      const links = build(on("page.work"), pagesLive).tickets.map((t) => t.href);
      expect(links).toEqual(["/work#hbk", "/work#optty", "/work#access-bank"]);
    });

    it("has no link at all when /work is not live yet, or its flag is off", () => {
      expect(build(flags, pagesSoon, []).tickets.map((t) => t.href)).toEqual([null, null, null]);
      expect(build({}, pagesLive, []).tickets.map((t) => t.href)).toEqual([null, null, null]);
      expect(build(on("page.work", "case.hbk-aiana"), pagesSoon, caseLive).tickets.at(0)?.href).toBe(
        "/work/hbk-aiana",
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
      const model = buildSelectedStops(success(all), on("page.work", "case.hbk-aiana"), "public");
      expect(model?.tickets.map((t) => t.href)).toEqual([null, null, null]);
    });
  });

  describe("See the whole route", () => {
    it("links /work only while the Work page is visible", () => {
      expect(buildSelectedStops(success(all), on("page.work"), "public")?.routeLink).toBe("/work");
      expect(buildSelectedStops(success(all), {}, "public")?.routeLink).toBeNull();
      expect(buildSelectedStops(success(all), { "page.work": "preview" }, "public")?.routeLink).toBeNull();
    });
  });
});
