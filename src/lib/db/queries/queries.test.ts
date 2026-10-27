import { cacheLife, cacheTag } from "next/cache";
import { fakeClient, type FakeResponse } from "../fake-client";
import { createPublicClient } from "../public-client";
import { failure, success } from "../result";
import { getCaseStudy, loadCaseStudy } from "./case-studies";
import { loadFlags } from "./flags";
import { getLabProjects, loadLabProjects } from "./lab";
import { getSettings, loadSettings } from "./settings";
import { getStops, loadStops } from "./stops";
import { getCountries, loadCountries } from "./travel";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("../public-client", () => ({ createPublicClient: vi.fn() }));

const stopRow = {
  id: "s1",
  slug: "access-bank",
  number: 2,
  name: "Access Bank",
  kind: "flagship",
  filters: ["payments"],
  start_year: 2018,
  end_year: 2021,
  via: null,
  summary: null,
  details: [],
  detail_sources: [],
  stack: [],
  status: "published",
  created_at: "",
  updated_at: "",
  outcomes: [
    {
      id: "o1",
      stop_id: "s1",
      case_study_id: null,
      lab_project_id: null,
      position: 0,
      figure: "1M+",
      description: "Google Play downloads",
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
    },
  ],
};

const ok = (data: unknown): FakeResponse => ({ data, error: null });
const broken: FakeResponse = { data: null, error: { message: "permission denied" } };

describe("the loaders", () => {
  it("loadStops returns mapped stops, ordered by number", async () => {
    const { client, from, query } = fakeClient(ok([stopRow]));
    const result = await loadStops(client);
    expect(from).toHaveBeenCalledWith("stops");
    expect(query.order).toHaveBeenCalledWith("number");
    expect(result.ok && result.data[0]?.outcomes[0]?.source).toMatchObject({ kind: "link" });
  });

  it("loadStops returns an empty list when nothing is published", async () => {
    expect(await loadStops(fakeClient(ok([])).client)).toEqual({ ok: true, data: [] });
  });

  it("loadStops reports a failed query without throwing", async () => {
    expect(await loadStops(fakeClient(broken).client)).toMatchObject({ ok: false, reason: "query_failed" });
  });

  it("loadStops reports a row with no usable source", async () => {
    const bad = { ...stopRow, outcomes: [{ ...stopRow.outcomes[0], source_url: null }] };
    expect(await loadStops(fakeClient(ok([bad])).client)).toMatchObject({
      ok: false,
      reason: "invalid_data",
    });
  });

  it("loadStops turns a thrown error into a failed result", async () => {
    const client = {
      from: () => {
        throw new Error("fetch failed");
      },
    } as never;
    expect(await loadStops(client)).toMatchObject({
      ok: false,
      reason: "query_failed",
      message: "fetch failed",
    });
  });

  it("loadFlags maps rows to a key and state map, and reports a failed query", async () => {
    const flags = await loadFlags(fakeClient(ok([{ key: "page.home", state: "on" }])).client);
    expect(flags).toEqual({ ok: true, data: { "page.home": "on" } });
    expect(await loadFlags(fakeClient(broken).client)).toMatchObject({ ok: false });
  });

  it("loadSettings fails when the table is empty", async () => {
    expect(await loadSettings(fakeClient(ok([])).client)).toMatchObject({
      ok: false,
      reason: "invalid_data",
    });
    expect(await loadSettings(fakeClient(broken).client)).toMatchObject({
      ok: false,
      reason: "query_failed",
    });
  });

  it("loadCaseStudy returns null for an unknown or draft slug", async () => {
    const { client, query } = fakeClient(ok(null));
    expect(await loadCaseStudy(client, "nope")).toEqual({ ok: true, data: null });
    expect(query.eq).toHaveBeenCalledWith("slug", "nope");
    expect(await loadCaseStudy(fakeClient(broken).client, "x")).toMatchObject({ ok: false });
  });

  it("loadLabProjects keeps a project without a live URL", async () => {
    const row = {
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
    };
    const result = await loadLabProjects(fakeClient(ok([row])).client);
    expect(result.ok && result.data[0]?.liveUrl).toBeNull();
    expect(await loadLabProjects(fakeClient(broken).client)).toMatchObject({ ok: false });
  });

  it("loadCountries puts the home country first", async () => {
    const country = (slug: string, is_home: boolean) => ({
      id: slug,
      slug,
      name: slug,
      iso2: "XX",
      is_home,
      visited_year: null,
      status: "published",
      created_at: "",
      updated_at: "",
      trips: [],
    });
    const result = await loadCountries(
      fakeClient(ok([country("albania", false), country("nigeria", true)])).client,
    );
    expect(result.ok && result.data.map((c) => c.slug)).toEqual(["nigeria", "albania"]);
    expect(await loadCountries(fakeClient(broken).client)).toMatchObject({ ok: false });
  });
});

describe("the cached readers", () => {
  const readers = [
    { name: "getStops", read: () => getStops(), tag: "stops", row: [stopRow] },
    { name: "getLabProjects", read: () => getLabProjects(), tag: "lab", row: [] },
    { name: "getCountries", read: () => getCountries(), tag: "travel", row: [] },
    {
      name: "getCaseStudy",
      read: () => getCaseStudy("hbk-aiana"),
      tag: "case-study:hbk-aiana",
      row: caseStudyRow,
    },
  ];

  beforeEach(() => {
    vi.mocked(cacheLife).mockClear();
    vi.mocked(cacheTag).mockClear();
  });

  it.each(readers)("$name caches for days on success and tags the entry", async ({ read, tag, row }) => {
    vi.mocked(createPublicClient).mockReturnValue(success(fakeClient(ok(row)).client));
    expect((await read()).ok).toBe(true);
    expect(cacheTag).toHaveBeenCalledWith(...(tag.startsWith("case-study:") ? ["case-studies", tag] : [tag]));
    expect(cacheLife).toHaveBeenCalledTimes(1);
    expect(cacheLife).toHaveBeenCalledWith("days");
  });

  it.each(readers)("$name caches for minutes when the client is not configured", async ({ read }) => {
    vi.mocked(createPublicClient).mockReturnValue(failure("unconfigured", "Supabase is not configured."));
    const result = await read();
    expect(result).toMatchObject({ ok: false, reason: "unconfigured" });
    expect(cacheLife).toHaveBeenCalledTimes(1);
    expect(cacheLife).toHaveBeenCalledWith("minutes");
  });

  it.each(readers)("$name caches for minutes when the query fails", async ({ read }) => {
    vi.mocked(createPublicClient).mockReturnValue(success(fakeClient(broken).client));
    expect(await read()).toMatchObject({ ok: false, reason: "query_failed" });
    expect(cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("getSettings follows the same rule", async () => {
    vi.mocked(createPublicClient).mockReturnValue(failure("unconfigured", "x"));
    expect(await getSettings()).toMatchObject({ ok: false });
    expect(cacheLife).toHaveBeenCalledWith("minutes");
    expect(cacheTag).toHaveBeenCalledWith("settings");
  });

  it("getCaseStudy checks a missing study again within minutes", async () => {
    vi.mocked(createPublicClient).mockReturnValue(success(fakeClient(ok(null)).client));
    expect(await getCaseStudy("draft-one")).toEqual({ ok: true, data: null });
    expect(cacheLife).toHaveBeenCalledWith("minutes");
    expect(cacheTag).toHaveBeenCalledWith("case-studies", "case-study:draft-one");
  });

  it("never uses the seconds profile", async () => {
    vi.mocked(createPublicClient).mockReturnValue(failure("unconfigured", "x"));
    await Promise.all(readers.map((reader) => reader.read()));
    expect(vi.mocked(cacheLife).mock.calls.flat()).not.toContain("seconds");
  });
});

const caseStudyRow = {
  id: "c1",
  slug: "hbk-aiana",
  stop_id: null,
  title: "HBK Advantage Aiana",
  tldr: ["One"],
  hero_media_id: null,
  status: "published",
  published_at: null,
  created_at: "",
  updated_at: "",
  case_study_sections: [],
  outcomes: [],
};
