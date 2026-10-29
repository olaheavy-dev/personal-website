import { checkText } from "./check-dashes.mjs";
import {
  ARCHIVE_GAP_MS,
  classifyError,
  classifyResponse,
  collectSources,
  containsPhrase,
  createHostThrottle,
  digestOf,
  planIssueAction,
  renderIssueBody,
  retryDelay,
  shouldArchive,
  type Report,
  type Result,
} from "./check-source-links.mjs";

const result = (over: Partial<Result> & { url: string }): Result => ({
  kind: "claim",
  usages: [{ owner: { type: "stop", name: "HBK", slug: "hbk" }, label: "Release notes" }],
  state: "ok",
  reason: "HTTP 200",
  retry: false,
  movedTo: null,
  ...over,
});
const report = (results: Result[], extra: Partial<Report> = {}): Report => ({
  date: "2026-11-02",
  results,
  ...extra,
});

describe("classifyResponse", () => {
  it("treats 404 and 410 as broken at once (A1)", () => {
    for (const status of [404, 410]) {
      expect(classifyResponse({ status, url: "https://a.com/x" })).toMatchObject({
        state: "broken",
        retry: false,
      });
    }
  });
  it("treats a 5xx as broken only after the last attempt (A1)", () => {
    expect(classifyResponse({ status: 503, url: "https://a.com/x" })).toMatchObject({
      state: "broken",
      retry: true,
    });
    expect(classifyResponse({ status: 503, url: "https://a.com/x", lastAttempt: true })).toMatchObject({
      state: "broken",
      retry: false,
    });
  });
  it("treats 401, 403, 429 and other 4xx as could not verify (A2)", () => {
    for (const status of [401, 403, 429, 418]) {
      expect(classifyResponse({ status, url: "https://a.com/x", lastAttempt: true })).toMatchObject({
        state: "unverified",
        retry: false,
      });
    }
    expect(classifyResponse({ status: 429, url: "https://a.com/x" }).retry).toBe(true);
  });
  it("notes a moved host without calling it a problem", () => {
    const v = classifyResponse({ status: 200, url: "https://a.com/x", finalUrl: "https://b.com/y" });
    expect(v).toMatchObject({ state: "ok", movedTo: "https://b.com/y" });
    expect(
      classifyResponse({ status: 200, url: "https://a.com/x", finalUrl: "https://www.a.com/z" }).movedTo,
    ).toBeNull();
  });
});

describe("classifyError", () => {
  it("treats a DNS failure as broken", () => {
    const error = Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    expect(classifyError(error, { lastAttempt: true })).toMatchObject({ state: "broken", retry: false });
  });
  it("treats timeouts and other errors as could not verify", () => {
    expect(
      classifyError(Object.assign(new Error("t"), { name: "TimeoutError" }), { lastAttempt: true }),
    ).toMatchObject({
      state: "unverified",
      reason: "timed out",
    });
    expect(classifyError(new Error("x"))).toMatchObject({ state: "unverified", retry: true });
  });
});

describe("retryDelay (A3)", () => {
  it("backs off 2 s then 8 s", () => {
    expect(retryDelay(1)).toBe(2000);
    expect(retryDelay(2)).toBe(8000);
  });
  it("honours Retry-After in seconds or as a date, capped at 30 s", () => {
    expect(retryDelay(1, "5")).toBe(5000);
    expect(retryDelay(1, "120")).toBe(30000);
    expect(retryDelay(1, "Wed, 21 Oct 2026 07:28:10 GMT", Date.parse("Wed, 21 Oct 2026 07:28:00 GMT"))).toBe(
      10000,
    );
    expect(retryDelay(1, "nonsense")).toBe(2000);
  });
});

describe("createHostThrottle (A4)", () => {
  it("waits so one host is never hit twice within the gap", async () => {
    let clock = 0;
    const slept: number[] = [];
    const throttle = createHostThrottle({
      minGapMs: 2000,
      now: () => clock,
      sleep: async (ms) => {
        slept.push(ms);
        clock += ms;
      },
    });
    await throttle.wait("https://a.com/1");
    clock += 500;
    await throttle.wait("https://www.a.com/2");
    await throttle.wait("https://b.com/1");
    clock += 5000;
    await throttle.wait("https://a.com/3");
    expect(slept).toEqual([1500]);
  });
});

describe("containsPhrase (B4)", () => {
  it("ignores tags, case, entities and spacing", () => {
    expect(containsPhrase("<p>Aiana  <b>Advantage</b>\n Insights</p>", "aiana advantage insights")).toBe(
      true,
    );
    expect(containsPhrase("<p>It&nbsp;is &amp; was</p>", "is & was")).toBe(true);
  });
  it("is false for a missing or empty phrase and ignores script text", () => {
    expect(containsPhrase("<p>hello</p>", "1M+")).toBe(false);
    expect(containsPhrase("<script>1M+</script>", "1M+")).toBe(false);
    expect(containsPhrase("anything", "")).toBe(false);
  });
});

describe("shouldArchive (A5)", () => {
  const now = Date.UTC(2026, 10, 2);
  it("saves a claim source with no snapshot", () => {
    expect(shouldArchive({ kind: "claim", now })).toBe(true);
  });
  it("skips own properties, stored archive URLs and recent snapshots", () => {
    expect(shouldArchive({ kind: "own", now })).toBe(false);
    expect(shouldArchive({ kind: "claim", storedArchiveUrl: "https://web.archive.org/web/1/x", now })).toBe(
      false,
    );
    expect(shouldArchive({ kind: "claim", snapshotTimestamp: "20260901120000", now })).toBe(false);
  });
  it("saves again when the snapshot is old", () => {
    expect(shouldArchive({ kind: "claim", snapshotTimestamp: "20240101000000", now })).toBe(true);
  });
  it("spaces saves 25 s apart", () => {
    expect(ARCHIVE_GAP_MS).toBe(25000);
  });
});

describe("collectSources", () => {
  const rows = {
    stops: [
      {
        id: "s1",
        slug: "hbk",
        name: "HBK",
        detail_sources: [
          { label: "Notes", url: "https://hbk.example/notes" },
          { label: "Bad", url: "http://insecure.example" },
        ],
      },
    ],
    caseStudies: [{ id: "c1", slug: "optty", title: "Optty" }],
    labProjects: [
      {
        id: "l1",
        slug: "fastpilot",
        name: "FastPilot",
        repo_url: "https://github.com/x/fastpilot",
        live_url: null,
      },
    ],
    outcomes: [
      {
        stop_id: "s1",
        source_kind: "link",
        source_label: "Google Play",
        source_url: "https://play.example/app",
        figure: "1M+",
      },
      {
        case_study_id: "c1",
        source_kind: "link",
        source_label: "Press",
        source_url: "https://hbk.example/notes",
        figure: "x",
      },
      { stop_id: "s1", source_kind: "own", source_url: null },
    ],
  };
  const sources = collectSources(rows, [
    {
      url: "https://static.example/p",
      label: "Static",
      kind: "claim",
      owner: { type: "home", name: "Home" },
    },
  ]);
  it("merges duplicate URLs and records where each is used", () => {
    const shared = sources.find((s) => s.url === "https://hbk.example/notes");
    expect(shared?.usages.map((u) => u.owner.name).sort()).toEqual(["HBK", "Optty"]);
  });
  it("marks claim sources and own properties, and drops non https and own measurements", () => {
    expect(sources.find((s) => s.url === "https://github.com/x/fastpilot")?.kind).toBe("own");
    expect(sources.find((s) => s.url === "https://play.example/app")?.kind).toBe("claim");
    expect(sources.some((s) => s.url.startsWith("http://"))).toBe(false);
    expect(sources.map((s) => s.url)).toHaveLength(4);
  });
});

describe("renderIssueBody (A8)", () => {
  const r = report(
    [
      result({ url: "https://a.example/gone", state: "broken", reason: "HTTP 404" }),
      result({ url: "https://b.example/blocked", state: "unverified", reason: "HTTP 403" }),
      result({ url: "https://c.example/old", state: "ok", movedTo: "https://d.example/new" }),
    ],
    {
      archived: [
        {
          url: "https://c.example/old",
          snapshotUrl: "https://web.archive.org/web/20261102000000/https://c.example/old",
        },
      ],
      archiveFailures: [{ url: "https://b.example/blocked", reason: "HTTP 429" }],
    },
  );
  it("names the stop and the link label under each heading", () => {
    const body = renderIssueBody(r);
    expect(body).toContain("## Broken (1)");
    expect(body).toContain("## Could not verify (1)");
    expect(body).toContain("## Archive save failed (1)");
    expect(body).toContain("## Moved (1)");
    expect(body).toContain("HBK (stop), Release notes");
    expect(body).toMatch(/source-links-digest: [0-9a-f]{16}/);
  });
  it("contains no dashes between words", () => {
    expect(checkText("issue-body.md", renderIssueBody(r), ".md")).toEqual([]);
  });
});

describe("planIssueAction (A6, A7)", () => {
  const clean = report([result({ url: "https://a.example/ok" })]);
  const broken = report([result({ url: "https://a.example/gone", state: "broken", reason: "HTTP 404" })]);
  const rows: [string, Parameters<typeof planIssueAction>[0], string][] = [
    ["problems and no issue", { existing: null, report: broken }, "create"],
    ["clean and no issue", { existing: null, report: clean }, "none"],
    [
      "same problems",
      { existing: { number: 7, body: `<!-- source-links-digest: ${digestOf(broken)} -->` }, report: broken },
      "update",
    ],
    [
      "changed problems",
      { existing: { number: 7, body: "<!-- source-links-digest: 0000 -->" }, report: broken },
      "update_comment",
    ],
    ["clean with an open issue", { existing: { number: 7, body: "" }, report: clean }, "comment_close"],
    ["database read failed", { existing: { number: 7, body: "" }, report: clean, readFailed: true }, "none"],
    ["no sources collected", { existing: { number: 7, body: "" }, report: report([]) }, "none"],
  ];
  it.each(rows)("%s", (_name, input, action) => {
    expect(planIssueAction(input).action).toBe(action);
  });
  it("counts a failed archive save as a problem but never as broken", () => {
    const r = report([result({ url: "https://a.example/ok" })], {
      archiveFailures: [{ url: "https://a.example/ok", reason: "x" }],
    });
    expect(planIssueAction({ existing: null, report: r }).action).toBe("create");
    expect(renderIssueBody(r)).not.toContain("## Broken");
  });
});
