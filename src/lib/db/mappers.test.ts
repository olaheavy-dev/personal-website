import {
  mapCaseStudy,
  mapCountry,
  mapFlags,
  mapLabProject,
  mapOutcome,
  mapSettings,
  mapStop,
} from "./mappers";
import type { Row } from "./types";

const outcomeRow = (over: Partial<Row<"outcomes">> = {}): Row<"outcomes"> => ({
  id: "o1",
  stop_id: "s1",
  case_study_id: null,
  lab_project_id: null,
  position: 0,
  figure: "1M+",
  description: "downloads",
  source_kind: "link",
  source_label: "Google Play listing",
  source_url: "https://play.google.com/x",
  source_note: null,
  checked_on: "2026-10-25",
  claim_scope: "company",
  attribution: "Google Play listing",
  as_of_year: 2026,
  created_at: "",
  updated_at: "",
  ...over,
});

type StopRow = Row<"stops"> & { outcomes: Row<"outcomes">[] };
const stopRow = (over: Partial<StopRow> = {}): StopRow => ({
  id: "s1",
  slug: "hbk",
  number: 7,
  name: "HBK",
  kind: "flagship",
  filters: ["ai", "data_iot"],
  start_year: 2024,
  end_year: null,
  via: null,
  summary: null,
  stack: [],
  status: "published",
  created_at: "",
  updated_at: "",
  outcomes: [],
  ...over,
});

describe("mapOutcome", () => {
  it("maps a link to the MetricSource shape", () => {
    expect(mapOutcome(outcomeRow())?.source).toEqual({
      kind: "link",
      label: "Google Play listing",
      url: "https://play.google.com/x",
    });
  });

  it("maps an own measurement", () => {
    const outcome = mapOutcome(
      outcomeRow({ source_kind: "own", source_label: null, source_url: null, source_note: "Lighthouse" }),
    );
    expect(outcome?.source).toEqual({ kind: "own", note: "Lighthouse" });
  });

  it("refuses a row without a usable source", () => {
    expect(mapOutcome(outcomeRow({ source_url: null }))).toBeNull();
    expect(mapOutcome(outcomeRow({ source_kind: "own", source_note: null }))).toBeNull();
  });
});

describe("mapStop", () => {
  it("turns data_iot into the data-iot URL value and sorts outcomes", () => {
    const result = mapStop(
      stopRow({ outcomes: [outcomeRow({ id: "b", position: 2 }), outcomeRow({ id: "a", position: 1 })] }),
    );
    expect(result.ok && result.data.filters).toEqual(["ai", "data-iot"]);
    expect(result.ok && result.data.outcomes.map((o) => o.id)).toEqual(["a", "b"]);
    expect(result.ok && result.data.endYear).toBeNull();
  });

  it("fails with invalid_data when an outcome has no source", () => {
    const result = mapStop(stopRow({ outcomes: [outcomeRow({ source_url: null })] }));
    expect(result).toMatchObject({ ok: false, reason: "invalid_data" });
  });
});

describe("mapCaseStudy", () => {
  it("sorts sections by position", () => {
    const section = (id: string, position: number): Row<"case_study_sections"> => ({
      id,
      case_study_id: "c1",
      anchor: "context",
      position,
      title: id,
      body: null,
      updated_at: "",
    });
    const result = mapCaseStudy({
      id: "c1",
      slug: "x",
      stop_id: null,
      title: "X",
      tldr: ["a"],
      hero_media_id: null,
      status: "published",
      published_at: null,
      created_at: "",
      updated_at: "",
      case_study_sections: [section("two", 2), section("one", 1)],
      outcomes: [],
    });
    expect(result.ok && result.data.sections.map((s) => s.id)).toEqual(["one", "two"]);
  });
});

describe("mapLabProject", () => {
  it("keeps the live URL null when there is none", () => {
    const result = mapLabProject({
      id: "l1",
      slug: "fastpilot",
      name: "FastPilot",
      summary: null,
      in_progress: false,
      repo_url: "https://github.com/x/y",
      live_url: null,
      demo_url: null,
      video_url: null,
      writeup_url: null,
      case_study_id: null,
      links_checked_on: null,
      position: 2,
      status: "published",
      created_at: "",
      updated_at: "",
      outcomes: [],
    });
    expect(result.ok && result.data.liveUrl).toBeNull();
    expect(result.ok && result.data.inProgress).toBe(false);
  });
});

describe("mapCountry and mapFlags", () => {
  it("sorts trips newest first", () => {
    const trip = (id: string, year: number): Row<"trips"> => ({
      id,
      country_id: "c",
      slug: id,
      title: id,
      year,
      status: "published",
      created_at: "",
      updated_at: "",
    });
    const country = mapCountry({
      id: "c",
      slug: "albania",
      name: "Albania",
      iso2: "AL",
      is_home: false,
      visited_year: 2026,
      status: "published",
      created_at: "",
      updated_at: "",
      trips: [trip("old", 2020), trip("new", 2026)],
    });
    expect(country.trips.map((t) => t.id)).toEqual(["new", "old"]);
  });

  it("maps flag rows by key", () => {
    expect(mapFlags([{ key: "page.home", state: "on" }])).toEqual({ "page.home": "on" });
  });
});

describe("mapSettings", () => {
  const rows = [
    ["site.name", "Sunkanmi Olawuwo"],
    ["site.first_name", "Sunkanmi"],
    ["site.url", "https://olaheavy.dev"],
    ["site.one_liner", "One liner"],
    ["site.description", "Description"],
    ["site.availability", "Open"],
    ["site.time_zone", "Europe/London"],
    ["site.time_zone_label", "UK"],
    ["site.copyright_since", 2026],
    ["site.resume_url", null],
    ["profile.github", { label: "GitHub", url: null }],
    ["profile.linkedin", { label: "LinkedIn", url: null }],
    ["profile.hashnode", { label: "Hashnode", url: null }],
    ["profile.x", { label: "X", url: "https://x.com/someone" }],
  ].map(([key, value]) => ({ key: key as string, value: value as never }));

  it("maps the settings rows", () => {
    const result = mapSettings(rows);
    expect(result.ok && result.data.name).toBe("Sunkanmi Olawuwo");
    expect(result.ok && result.data.resumeUrl).toBeNull();
    expect(result.ok && result.data.profiles.map((p) => p.key)).toEqual([
      "github",
      "linkedin",
      "hashnode",
      "x",
    ]);
  });

  it("fails and names what is missing", () => {
    const result = mapSettings(rows.filter((row) => row.key !== "site.name"));
    expect(result).toMatchObject({ ok: false, reason: "invalid_data" });
    expect(JSON.stringify(result)).toContain("site.name");
  });
});
