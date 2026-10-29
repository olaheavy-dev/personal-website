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
  source_phrase: null,
  source_archive_url: null,
  source_broken_on: null,
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
  role: "Backend Software Engineer",
  summary: null,
  details: [],
  detail_sources: [],
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

  it("adds the archive copy and broken day, and never the phrase", () => {
    const archive = "https://web.archive.org/web/20261029213726/https://play.google.com/x";
    const source = mapOutcome(
      outcomeRow({
        source_phrase: "1,000,000+",
        source_archive_url: archive,
        source_broken_on: "2026-11-02",
      }),
    )?.source;
    expect(source).toEqual({
      kind: "link",
      label: "Google Play listing",
      url: "https://play.google.com/x",
      archiveUrl: archive,
      brokenOn: "2026-11-02",
    });
    expect(JSON.stringify(source)).not.toContain("1,000,000");
    expect(mapOutcome(outcomeRow({ source_archive_url: archive }))?.source).toEqual({
      kind: "link",
      label: "Google Play listing",
      url: "https://play.google.com/x",
      archiveUrl: archive,
    });
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

  it("maps the details lines, empty by default", () => {
    expect(mapStop(stopRow({ details: ["One.", "Two."] }))).toMatchObject({
      ok: true,
      data: { details: ["One.", "Two."] },
    });
    expect(mapStop(stopRow())).toMatchObject({ ok: true, data: { details: [] } });
  });

  it("maps the detail sources, empty by default, and fails on a malformed or non https one", () => {
    const sources = [{ label: "Konga partnership", url: "https://brandcom.ng/x/" }];
    expect(mapStop(stopRow({ detail_sources: sources }))).toMatchObject({
      ok: true,
      data: { detailSources: sources },
    });
    expect(mapStop(stopRow())).toMatchObject({ ok: true, data: { detailSources: [] } });
    for (const bad of [
      [{ label: "A", url: "http://example.com" }],
      [{ label: "", url: "https://example.com" }],
      [{ url: "https://example.com" }],
      "https://example.com",
    ]) {
      expect(mapStop(stopRow({ detail_sources: bad }))).toMatchObject({ ok: false, reason: "invalid_data" });
    }
  });

  it("accepts the optional phrase, archive_url and broken_on keys and maps the last two", () => {
    const archive = "https://web.archive.org/web/20261029213726/https://brandcom.ng/x/";
    const result = mapStop(
      stopRow({
        detail_sources: [
          { label: "A", url: "https://brandcom.ng/x/", phrase: "installment payments" },
          { label: "B", url: "https://brandcom.ng/y/", archive_url: archive, broken_on: "2026-11-02" },
        ],
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      data: {
        detailSources: [
          { label: "A", url: "https://brandcom.ng/x/" },
          { label: "B", url: "https://brandcom.ng/y/", archiveUrl: archive, brokenOn: "2026-11-02" },
        ],
      },
    });
    expect(result.ok && result.data.detailSources[0]).not.toHaveProperty("phrase");
  });

  it("fails on a malformed archive_url or broken_on", () => {
    for (const bad of [
      { archive_url: "https://example.com/a" },
      { archive_url: 3 },
      { broken_on: "yesterday" },
    ]) {
      const sources = [{ label: "A", url: "https://example.com/a", ...bad }];
      expect(mapStop(stopRow({ detail_sources: sources }))).toMatchObject({
        ok: false,
        reason: "invalid_data",
      });
    }
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
