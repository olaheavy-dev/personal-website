import { checkText } from "./check-dashes.mjs";
import {
  archiveClaims,
  checkOne,
  classifyError,
  classifyResponse,
  describeError,
  isOwnUrl,
  collectSources,
  containsPhrase,
  createHostThrottle,
  digestOf,
  findIssue,
  planIssueAction,
  renderIssueBody,
  retryDelay,
  saveSnapshot,
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
  it("treats only 500 to 599 as the broken server range", () => {
    expect(classifyResponse({ status: 599, url: "https://a.com/x", lastAttempt: true }).state).toBe("broken");
    expect(classifyResponse({ status: 999, url: "https://a.com/x", lastAttempt: true }).state).toBe(
      "unverified",
    );
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
    for (const status of [401, 403, 429, 418, 999]) {
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
  it("does not open an issue for could not verify, a failed archive save or a moved link", () => {
    const r = report(
      [
        result({ url: "https://a.example/ok", movedTo: "https://b.example/" }),
        result({ url: "https://c.example/x", state: "unverified", reason: "HTTP 403" }),
      ],
      { archiveFailures: [{ url: "https://a.example/ok", reason: "x" }] },
    );
    expect(planIssueAction({ existing: null, report: r }).action).toBe("none");
    expect(renderIssueBody(r)).not.toContain("## Broken");
  });
  it("closes an open issue when only informational entries remain", () => {
    const r = report([result({ url: "https://c.example/x", state: "unverified", reason: "HTTP 403" })]);
    expect(planIssueAction({ existing: { number: 7, body: "" }, report: r }).action).toBe("comment_close");
  });
  it("comments when an informational entry changes while the issue stays open", () => {
    const before = report([broken.results[0]!, result({ url: "https://c.example/x" })]);
    const after = report([
      broken.results[0]!,
      result({ url: "https://c.example/x", state: "unverified", reason: "HTTP 403" }),
    ]);
    const body = `<!-- source-links-digest: ${digestOf(before)} -->`;
    expect(planIssueAction({ existing: { number: 7, body }, report: after }).action).toBe("update_comment");
  });
});

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;
const stub = (handler: Handler) => {
  const calls: { url: string; method: string }[] = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? "GET" });
    return handler(url, init);
  }) as typeof fetch;
  return { fetchImpl, calls };
};
const withUrl = (res: Response, url: string) => Object.defineProperty(res, "url", { value: url });
const source = { url: "https://a.example/page", kind: "claim" as const, usages: [] };
const recorder = () => {
  const slept: number[] = [];
  return { slept, sleep: async (ms: number) => void slept.push(ms) };
};

describe("checkOne behaviour (A1 to A3)", () => {
  it("503, 503, 200 is ok after sleeps of 2000 and 8000", async () => {
    const answers = [503, 503, 200];
    let current = 0;
    const { fetchImpl } = stub((_u, init) => {
      if (init.method === "HEAD") current = answers.shift()!;
      return new Response(null, { status: current });
    });
    const { slept, sleep } = recorder();
    const r = await checkOne(source, { fetchImpl, sleep });
    expect(r.state).toBe("ok");
    expect(slept).toEqual([2000, 8000]);
  });
  it("three 503 answers are broken", async () => {
    const { fetchImpl } = stub(() => new Response(null, { status: 503 }));
    const { sleep } = recorder();
    expect((await checkOne(source, { fetchImpl, sleep })).state).toBe("broken");
  });
  const sequence = (answers: (number | Error)[]) =>
    stub(() => {
      const next = answers.shift()!;
      if (next instanceof Error) throw next;
      return new Response(null, { status: next });
    });
  const dns = () => Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
  const timeout = () => Object.assign(new Error("t"), { name: "TimeoutError" });
  it("429, 429, then 503 is could not verify, because the 5xx did not happen on every attempt", async () => {
    // HEAD 503 falls back to GET, so the last attempt answers 503 twice.
    const { fetchImpl } = sequence([429, 429, 503, 503]);
    const r = await checkOne(source, { fetchImpl, sleep: recorder().sleep });
    expect(r.state).toBe("unverified");
    expect(r.reason).toBe("mixed failures: HTTP 429, HTTP 429, HTTP 503");
  });
  it("a timeout then two DNS failures is could not verify, and three DNS failures are broken", async () => {
    const mixed = sequence([timeout(), dns(), dns()]);
    expect((await checkOne(source, { fetchImpl: mixed.fetchImpl, sleep: recorder().sleep })).state).toBe(
      "unverified",
    );
    const gone = sequence([dns(), dns(), dns()]);
    expect((await checkOne(source, { fetchImpl: gone.fetchImpl, sleep: recorder().sleep })).state).toBe(
      "broken",
    );
  });
  it("503, then a DNS failure, then 503 is broken, since every attempt failed", async () => {
    const { fetchImpl } = sequence([503, 503, dns(), 503, 503]);
    expect((await checkOne(source, { fetchImpl, sleep: recorder().sleep })).state).toBe("broken");
  });
  it("429 then 404 is broken, because 404 is final at once", async () => {
    const { fetchImpl } = sequence([429, 404, 404]);
    const r = await checkOne(source, { fetchImpl, sleep: recorder().sleep });
    expect(r).toMatchObject({ state: "broken", reason: "HTTP 404" });
  });
  it("429 with Retry-After 5 sleeps 5000 (HEAD only)", async () => {
    const { fetchImpl } = stub(() => new Response(null, { status: 429, headers: { "retry-after": "5" } }));
    const { slept, sleep } = recorder();
    const r = await checkOne(source, { fetchImpl, sleep });
    expect(slept).toEqual([5000, 5000]);
    expect(r.state).toBe("unverified");
  });
  it("does not fall back to GET on a 429, so the retry loop applies Retry-After", async () => {
    const { fetchImpl, calls } = stub(
      () => new Response(null, { status: 429, headers: { "retry-after": "5" } }),
    );
    const { slept, sleep } = recorder();
    await checkOne(source, { fetchImpl, sleep });
    expect(calls.every((c) => c.method === "HEAD")).toBe(true);
    expect(calls).toHaveLength(3);
    expect(slept).toEqual([5000, 5000]);
  });
  it("HEAD 405 then GET 200 is ok", async () => {
    const { fetchImpl, calls } = stub(
      (_u, init) => new Response(null, { status: init.method === "HEAD" ? 405 : 200 }),
    );
    const r = await checkOne(source, { fetchImpl, sleep: recorder().sleep });
    expect(r.state).toBe("ok");
    expect(calls.map((c) => c.method)).toEqual(["HEAD", "GET"]);
  });
  it("HEAD 404 then GET 200 is ok, and HEAD 404 then GET 404 is broken", async () => {
    const ok = stub((_u, init) => new Response(null, { status: init.method === "HEAD" ? 404 : 200 }));
    expect((await checkOne(source, { fetchImpl: ok.fetchImpl, sleep: recorder().sleep })).state).toBe("ok");
    const gone = stub(() => new Response(null, { status: 404 }));
    expect((await checkOne(source, { fetchImpl: gone.fetchImpl, sleep: recorder().sleep })).state).toBe(
      "broken",
    );
  });
  it("notes a redirect to another host", async () => {
    const { fetchImpl } = stub(() => withUrl(new Response(null, { status: 200 }), "https://b.example/new"));
    expect((await checkOne(source, { fetchImpl, sleep: recorder().sleep })).movedTo).toBe(
      "https://b.example/new",
    );
  });
});

describe("archiveClaims behaviour (A5, A6, P3-5)", () => {
  const snapshotUrl = "https://web.archive.org/web/20261102000000/https://a.example/";
  const available = (closest: unknown) =>
    new Response(JSON.stringify({ archived_snapshots: closest ? { closest } : {} }));
  const saved = () =>
    new Response("", {
      status: 200,
      headers: { "content-location": "/web/20261102000000/https://a.example/" },
    });
  const claims = (n: number) =>
    Array.from(
      { length: n },
      (_, i) => ({ ...source, url: `https://a${i}.example/`, state: "ok" as const }) as unknown as Result,
    );

  it("saves the first at once, waits 25000 before the second, and skips the eleventh", async () => {
    const { fetchImpl, calls } = stub((url) =>
      url.includes("/wayback/available") ? available(null) : saved(),
    );
    const { slept, sleep } = recorder();
    const out = await archiveClaims(claims(11), { fetchImpl, sleep });
    expect(out.archived).toHaveLength(10);
    expect(slept).toEqual(Array(9).fill(25000));
    expect(calls.filter((c) => c.url.includes("web.archive.org/save/"))).toHaveLength(10);
    expect(out.archived[0]!.snapshotUrl).toBe(snapshotUrl);
  });
  it("skips a source with a recent usable snapshot, and saves when the snapshot is not usable", async () => {
    const recent = { available: true, status: "200", timestamp: "20991231000000", url: "x" };
    const first = stub((url) => (url.includes("/wayback/available") ? available(recent) : saved()));
    expect(
      (await archiveClaims(claims(1), { fetchImpl: first.fetchImpl, sleep: recorder().sleep })).archived,
    ).toHaveLength(0);
    for (const bad of [
      { ...recent, available: false },
      { ...recent, status: "404" },
    ]) {
      const s = stub((url) => (url.includes("/wayback/available") ? available(bad) : saved()));
      expect(
        (await archiveClaims(claims(1), { fetchImpl: s.fetchImpl, sleep: recorder().sleep })).archived,
      ).toHaveLength(1);
    }
  });
  it("reports a 200 save without a snapshot address as an archive failure", async () => {
    const { fetchImpl } = stub((url) =>
      url.includes("/wayback/available") ? available(null) : new Response("", { status: 200 }),
    );
    const out = await archiveClaims(claims(1), { fetchImpl, sleep: recorder().sleep });
    expect(out.archived).toEqual([]);
    expect(out.archiveFailures).toHaveLength(1);
  });
  it("reads the address from a memento Link header", async () => {
    const { fetchImpl } = stub(
      () =>
        new Response("", {
          status: 200,
          headers: { link: '<https://web.archive.org/web/20261102000000/https://a.example/>; rel="memento"' },
        }),
    );
    expect(await saveSnapshot("https://a.example/", fetchImpl)).toBe(snapshotUrl);
  });
  it("never saves broken sources or own properties", async () => {
    const { fetchImpl, calls } = stub(() => available(null));
    const rows = [
      { ...claims(1)[0]!, state: "broken" as const },
      { ...claims(1)[0]!, kind: "own" as const },
    ];
    await archiveClaims(rows, { fetchImpl, sleep: recorder().sleep });
    expect(calls).toEqual([]);
  });
});

describe("findIssue (A7)", () => {
  const prior = process.env.GITHUB_REPOSITORY;
  beforeAll(() => void (process.env.GITHUB_REPOSITORY = "o/r"));
  afterAll(() => void (process.env.GITHUB_REPOSITORY = prior));
  const list = (items: unknown[]) => stub(() => new Response(JSON.stringify(items)));
  it("ignores pull requests and needs the exact title", async () => {
    const { fetchImpl, calls } = list([
      { number: 1, title: "Source links: weekly check", pull_request: {} },
      { number: 2, title: "Source links: weekly check (copy)" },
      { number: 3, title: "Source links: weekly check" },
    ]);
    expect((await findIssue(fetchImpl))?.number).toBe(3);
    expect(calls[0]!.url).toContain("labels=links");
    expect(calls[0]!.url).toContain("state=open");
  });
  it("returns null when nothing matches", async () => {
    expect(await findIssue(list([{ number: 2, title: "Other" }]).fetchImpl)).toBeNull();
  });
});

describe("renderIssueBody links", () => {
  it("wraps third party URLs in angle brackets", () => {
    const body = renderIssueBody(
      report([result({ url: "https://a.example/gone", state: "broken", reason: "HTTP 404" })]),
    );
    expect(body).toContain("<https://a.example/gone>");
  });
});

describe("digest", () => {
  it("changes when a moved link's destination or an entry's reason changes, not when the date does", () => {
    const moved = (to: string) => report([result({ url: "https://a.example/ok", movedTo: to })]);
    expect(digestOf(moved("https://b.example/"))).not.toBe(digestOf(moved("https://c.example/")));
    const failing = (reason: string) =>
      report([result({ url: "https://a.example/x", state: "unverified", reason })]);
    expect(digestOf(failing("HTTP 403"))).not.toBe(digestOf(failing("HTTP 429")));
    const failedSave = (reason: string) =>
      report([result({ url: "https://a.example/ok" })], {
        archiveFailures: [{ url: "https://a.example/ok", reason }],
      });
    expect(digestOf(failedSave("HTTP 520"))).not.toBe(digestOf(failedSave("timed out")));
    expect(digestOf({ ...moved("https://b.example/"), date: "2026-11-09" })).toBe(
      digestOf(moved("https://b.example/")),
    );
  });
  it("ignores a newly archived copy but not a failed save", () => {
    const base = report([result({ url: "https://a.example/ok" })]);
    const archived = {
      ...base,
      archived: [
        { url: "https://a.example/ok", snapshotUrl: "https://web.archive.org/web/20261102000000/x" },
      ],
    };
    expect(digestOf(archived)).toBe(digestOf(base));
    expect(digestOf({ ...base, archiveFailures: [{ url: "https://a.example/ok", reason: "x" }] })).not.toBe(
      digestOf(base),
    );
  });
});

const withCause = (code: string, message = "other side closed") =>
  Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error(message), { code }) });

describe("failure reasons carry the cause", () => {
  it("describeError shows the underlying code and message", () => {
    expect(describeError(withCause("UND_ERR_HEADERS_TIMEOUT", "Headers Timeout Error"))).toBe(
      "fetch failed (UND_ERR_HEADERS_TIMEOUT: Headers Timeout Error)",
    );
    expect(describeError(new Error("plain"))).toBe("plain");
  });
  it("a link check names ECONNRESET instead of bare fetch failed", async () => {
    const fetchImpl = (async () => {
      throw withCause("ECONNRESET", "read ECONNRESET");
    }) as typeof fetch;
    const r = await checkOne(source, { fetchImpl, sleep: recorder().sleep });
    expect(r.state).toBe("unverified");
    expect(r.reason).toContain("ECONNRESET");
  });
  it("an archive failure names the cause and is logged", async () => {
    const lines: string[] = [];
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("/wayback/available"))
        return new Response(JSON.stringify({ archived_snapshots: {} }));
      throw withCause("UND_ERR_HEADERS_TIMEOUT", "Headers Timeout Error");
    }) as typeof fetch;
    const out = await archiveClaims([{ ...source, state: "ok" } as unknown as Result], {
      fetchImpl,
      sleep: recorder().sleep,
      log: (l) => lines.push(l),
    });
    expect(out.archiveFailures[0]!.reason).toContain("UND_ERR_HEADERS_TIMEOUT");
    expect(lines.some((l) => l.startsWith("availability https://a.example/page: no usable snapshot"))).toBe(
      true,
    );
    expect(
      lines.some((l) => l.startsWith("archive failed https://a.example/page: fetch failed (UND_ERR")),
    ).toBe(true);
  });
});

describe("archive log lines", () => {
  const ok = (url: string, kind: "claim" | "own") =>
    ({ ...source, url, kind, state: "ok" }) as unknown as Result;
  it("logs saved, skipped for a recent snapshot, own source and cap reached", async () => {
    const lines: string[] = [];
    const fetchImpl = (async (url: string) => {
      const u = String(url);
      if (u.includes("recent"))
        return new Response(
          JSON.stringify({
            archived_snapshots: {
              closest: {
                available: true,
                status: "200",
                timestamp: "20991231000000",
                url: "https://web.archive.org/web/20991231000000/x",
              },
            },
          }),
        );
      if (u.includes("/wayback/available")) return new Response(JSON.stringify({ archived_snapshots: {} }));
      return new Response("", { status: 200, headers: { "content-location": "/web/20261102000000/x" } });
    }) as typeof fetch;
    const results = [
      ok("https://recent.example/", "claim"),
      ok("https://own.example/", "own"),
      ...Array.from({ length: 11 }, (_, i) => ok(`https://n${i}.example/`, "claim")),
    ];
    const out = await archiveClaims(results, {
      fetchImpl,
      sleep: recorder().sleep,
      log: (l) => lines.push(l),
    });
    expect(lines).toContain("archive skipped https://recent.example/ (recent snapshot)");
    expect(lines).toContain("archive skipped https://own.example/ (own source)");
    expect(lines).toContain("archive skipped https://n10.example/ (cap reached)");
    expect(
      lines.some((l) =>
        l.startsWith("archive saved https://n0.example/ -> https://web.archive.org/web/20261102000000/x"),
      ),
    ).toBe(true);
    expect(out.skipped).toHaveLength(3);
  });
});

describe("own sources are never archived", () => {
  it("isOwnUrl covers the owner's GitHub and olaheavy.dev hosts only", () => {
    for (const u of [
      "https://github.com/olaheavy-dev/fastpilot",
      "https://github.com/olaheavy-dev/Foresight",
      "https://github.com/olaheavy-dev/homescout-platform",
      "https://olaheavy.dev/work",
      "https://staging.olaheavy.dev/",
    ])
      expect(isOwnUrl(u)).toBe(true);
    for (const u of [
      "https://github.com/other/fastpilot",
      "https://notolaheavy.dev/",
      "https://github.com/olaheavy-devx/a",
    ])
      expect(isOwnUrl(u)).toBe(false);
  });
  it("collectSources marks them own even when an outcome cites them, so archiveClaims skips them", async () => {
    const rows = {
      stops: [
        {
          id: "s1",
          slug: "x",
          name: "X",
          detail_sources: [{ label: "Repo", url: "https://github.com/olaheavy-dev/fastpilot" }],
        },
      ],
      labProjects: [
        {
          id: "l1",
          slug: "homescout",
          name: "HomeScout",
          repo_url: "https://github.com/olaheavy-dev/homescout-platform",
          live_url: "https://example.com/live",
        },
        { id: "l2", slug: "foresight", name: "Foresight", repo_url: null },
      ],
      outcomes: [
        {
          stop_id: "s1",
          source_kind: "link",
          source_label: "Repo",
          source_url: "https://github.com/olaheavy-dev/Foresight",
          figure: "f",
        },
        {
          lab_project_id: "l1",
          source_kind: "link",
          source_label: "Demo",
          source_url: "https://example.com/demo",
          figure: "d",
        },
        {
          stop_id: "s1",
          source_kind: "link",
          source_label: "Press",
          source_url: "https://press.example/a",
          figure: "p",
        },
      ],
    };
    const sources = collectSources(rows);
    const kind = (u: string) => sources.find((s) => s.url === u)?.kind;
    expect(kind("https://github.com/olaheavy-dev/fastpilot")).toBe("own");
    expect(kind("https://github.com/olaheavy-dev/Foresight")).toBe("own");
    expect(kind("https://github.com/olaheavy-dev/homescout-platform")).toBe("own");
    expect(kind("https://example.com/live")).toBe("own");
    expect(kind("https://example.com/demo")).toBe("own");
    expect(kind("https://press.example/a")).toBe("claim");
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(String(url));
      return new Response(JSON.stringify({ archived_snapshots: {} }));
    }) as typeof fetch;
    const results = sources.map((s) => ({ ...s, state: "ok" }) as unknown as Result);
    await archiveClaims(results, { fetchImpl, sleep: recorder().sleep, log: () => {} });
    expect(calls.filter((c) => /olaheavy-dev|example\.com/.test(c))).toEqual([]);
  });
});
