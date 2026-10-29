// Weekly source link checker (issue #127, claims policy decision 0005).
//
// Reads every public source URL the site shows from the hosted database with the publishable
// key (the same read the site does), requests each politely, saves claim sources to the Internet
// Archive, and opens, updates or closes ONE GitHub issue titled "Source links: weekly check".
// It never writes to the database.
//
// Classification:
//   broken            404 or 410, or a DNS failure or 5xx on every attempt within the run
//   could not verify  401, 403, 429, other 4xx, unusual codes, errors that persist after retries,
//                     and mixed attempts (for example 429, 429, then 503)
//   moved             the final host differs (a note only, never a problem)
// Only "broken" opens (or keeps open) the issue. The other sections are informational.
//
// Usage (the workflow sets the environment):
//   node scripts/check-source-links.mjs            full run
//   node scripts/check-source-links.mjs --dry-run  check and print the issue body, change nothing
// Environment: SUPABASE_URL, SUPABASE_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY.
import { createHash } from "node:crypto";
import { appendFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const ISSUE_TITLE = "Source links: weekly check";
export const ISSUE_LABEL = "links";
export const USER_AGENT =
  "olaheavy.dev-source-link-checker/1.0 (+https://github.com/olaheavy-dev/personal-website; weekly check of cited sources)";
export const REQUEST_GAP_MS = 2000;
export const ARCHIVE_GAP_MS = 25000;
export const MAX_ARCHIVE_PER_RUN = 10;
export const SNAPSHOT_MAX_AGE_DAYS = 180;
export const RETRY_CAP_MS = 30000;
const BACKOFF_MS = [2000, 8000];
const DIGEST_MARKER = "source-links-digest";

// Sources that live in code rather than the database. A test keeps this list in step with `src`.
export const STATIC_SOURCES = [
  {
    url: "https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights",
    label: "HBK Advantage Insights release notes",
    kind: "claim",
    owner: { type: "home", name: "Home page, HBK ticket" },
  },
];

// ---------------------------------------------------------------- collecting

/**
 * The owner's own properties (decision 0005, approved question 7): their GitHub repositories and
 * olaheavy.dev hosts. They are checked but never archived, wherever the link is used.
 */
export function isOwnUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/\.$/, "");
    if (host === "olaheavy.dev" || host.endsWith(".olaheavy.dev")) return true;
    return (host === "github.com" || host === "www.github.com") && /^\/olaheavy-dev(\/|$)/i.test(u.pathname);
  } catch {
    return false;
  }
}

function addUsage(map, url, kind, usage, extra = {}) {
  const entry = map.get(url) ?? { url, kind: "own", usages: [], phrases: [], archiveUrl: null };
  if (kind === "claim" && !isOwnUrl(url)) entry.kind = "claim";
  // Phrases and stored archive copies belong to claim sources only (never the owner's own pages).
  if (entry.kind === "claim") {
    const phrase = typeof extra.phrase === "string" ? extra.phrase.trim() : "";
    if (phrase && !entry.phrases.includes(phrase)) entry.phrases.push(phrase);
    if (!entry.archiveUrl && typeof extra.archiveUrl === "string" && extra.archiveUrl)
      entry.archiveUrl = extra.archiveUrl;
  }
  const key = `${usage.owner.type}:${usage.owner.name}:${usage.label}`;
  if (!entry.usages.some((u) => `${u.owner.type}:${u.owner.name}:${u.label}` === key))
    entry.usages.push(usage);
  map.set(url, entry);
}

/**
 * Every distinct source URL with where it is used. Claim sources (outcome links, stop detail
 * sources, static list) get a status check and an archive copy; own properties (Lab links) get
 * a status check only. Rows that are not https URLs are ignored.
 */
export function collectSources(
  { stops = [], caseStudies = [], labProjects = [], outcomes = [] },
  staticSources = [],
) {
  const map = new Map();
  const isHttps = (u) => typeof u === "string" && /^https:\/\/\S+$/.test(u);
  const stopById = new Map(stops.map((s) => [s.id, s]));
  const caseById = new Map(caseStudies.map((c) => [c.id, c]));
  const labById = new Map(labProjects.map((l) => [l.id, l]));

  for (const o of outcomes) {
    if (o.source_kind !== "link" || !isHttps(o.source_url)) continue;
    const stop = stopById.get(o.stop_id);
    const study = caseById.get(o.case_study_id);
    const lab = labById.get(o.lab_project_id);
    const owner = stop
      ? { type: "stop", name: stop.name, slug: stop.slug }
      : study
        ? { type: "case study", name: study.title, slug: study.slug }
        : lab
          ? { type: "lab project", name: lab.name, slug: lab.slug }
          : { type: "outcome", name: "unknown parent" };
    addUsage(
      map,
      o.source_url,
      "claim",
      { owner, label: o.source_label || o.figure || "source" },
      { phrase: o.source_phrase, archiveUrl: o.source_archive_url },
    );
  }
  for (const s of stops) {
    for (const item of Array.isArray(s.detail_sources) ? s.detail_sources : []) {
      if (!item || !isHttps(item.url)) continue;
      addUsage(
        map,
        item.url,
        "claim",
        {
          owner: { type: "stop", name: s.name, slug: s.slug },
          label: item.label || "detail source",
        },
        { phrase: item.phrase, archiveUrl: item.archive_url },
      );
    }
  }
  for (const l of labProjects) {
    for (const [field, label] of [
      ["repo_url", "repository"],
      ["live_url", "live site"],
      ["demo_url", "demo"],
      ["video_url", "video"],
      ["writeup_url", "write-up"],
    ]) {
      if (!isHttps(l[field])) continue;
      addUsage(map, l[field], "own", { owner: { type: "lab project", name: l.name, slug: l.slug }, label });
    }
  }
  for (const s of staticSources) addUsage(map, s.url, s.kind, { owner: s.owner, label: s.label });
  return [...map.values()].sort((a, b) => a.url.localeCompare(b.url));
}

// ------------------------------------------------------------ classification

const hostOf = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/**
 * What one HTTP answer means. `retry` is true while another attempt is worth making, so a 5xx
 * on the last attempt is final ("broken") but on an earlier one is only provisional.
 * `movedTo` is set when the final host differs from the requested one.
 */
export function classifyResponse(input) {
  const verdict = classifyStatus(input);
  return { ...verdict, reasonCode: verdict.reason };
}

function classifyStatus({ status, url, finalUrl, lastAttempt = false }) {
  const movedTo = finalUrl && hostOf(finalUrl) && hostOf(finalUrl) !== hostOf(url) ? finalUrl : null;
  if (status === 404 || status === 410)
    return { state: "broken", reason: `HTTP ${status}`, retry: false, movedTo };
  if (status >= 500 && status <= 599)
    return { state: "broken", reason: `HTTP ${status}`, retry: !lastAttempt, movedTo };
  if (status === 429) return { state: "unverified", reason: "HTTP 429", retry: !lastAttempt, movedTo };
  if (status >= 200 && status <= 399) return { state: "ok", reason: `HTTP ${status}`, retry: false, movedTo };
  // 401, 403, other 4xx and unusual codes (for example 999) say nothing about the page itself.
  return { state: "unverified", reason: `HTTP ${status}`, retry: false, movedTo };
}

/** The error with its underlying cause, so "fetch failed" shows why (for example ECONNRESET). */
export function describeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "failed");
  const cause = error?.cause;
  if (!cause) return message;
  const detail = [cause.code ?? cause.name, cause.message].filter(Boolean).join(": ");
  return detail && detail !== message ? `${message} (${detail})` : message;
}

/** A short stable code for an error (no addresses or ports), used in the digest. */
export function errorCode(error) {
  return String(error?.code ?? error?.cause?.code ?? error?.cause?.name ?? error?.name ?? "error");
}

/** What a failed request (no answer) means. DNS "not found" is broken; everything else is not verifiable. */
export function classifyError(error, { lastAttempt = false } = {}) {
  const code = error?.cause?.code ?? error?.code ?? "";
  if (code === "ENOTFOUND")
    return {
      state: "broken",
      reason: "DNS lookup failed",
      reasonCode: "ENOTFOUND",
      retry: !lastAttempt,
      movedTo: null,
    };
  const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
  return {
    state: "unverified",
    reason: timedOut ? "timed out" : describeError(error),
    reasonCode: timedOut ? "TIMEOUT" : errorCode(error),
    retry: !lastAttempt,
    movedTo: null,
  };
}

/** Milliseconds to wait before attempt `attempt + 1` (attempt starts at 1). Retry-After wins, capped at 30 s. */
export function retryDelay(attempt, retryAfter, now = Date.now()) {
  if (retryAfter !== undefined && retryAfter !== null && String(retryAfter).trim() !== "") {
    const text = String(retryAfter).trim();
    let ms = NaN;
    if (/^\d+$/.test(text)) ms = Number(text) * 1000;
    else {
      const date = Date.parse(text);
      if (!Number.isNaN(date)) ms = date - now;
    }
    if (!Number.isNaN(ms)) return Math.min(Math.max(ms, 0), RETRY_CAP_MS);
  }
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length) - 1] ?? BACKOFF_MS.at(-1);
}

/**
 * Spaces requests to the same host at least `minGapMs` apart. `wait(url)` resolves when it is
 * polite to send. Time and sleeping are injected so tests need no real delay.
 */
export function createHostThrottle({
  minGapMs = REQUEST_GAP_MS,
  now = () => Date.now(),
  sleep = defaultSleep,
} = {}) {
  const last = new Map();
  return {
    async wait(url) {
      const host = hostOf(url);
      const since = now() - (last.get(host) ?? -Infinity);
      if (since < minGapMs) await sleep(minGapMs - since);
      last.set(host, now());
    },
  };
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const normalise = (text) =>
  text
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** True when the page text contains the phrase, ignoring tags, case, entities and spacing. */
export function containsPhrase(html, phrase) {
  const needle = normalise(String(phrase ?? ""));
  if (!needle) return false;
  return normalise(String(html ?? "")).includes(needle);
}

/**
 * Which phrase answer to report. Only text pages can be searched: text/html and text/plain.
 * Anything else (a PDF, JSON, an image) is "not checkable", never "missing".
 */
export function isCheckableContentType(contentType) {
  return /^\s*(text\/html|text\/plain)\s*(;|$)/i.test(String(contentType ?? ""));
}

const MIB = 1024 * 1024;
export const PHRASE_MAX_BYTES = 3 * MIB;
const formatCap = (bytes) => (bytes % MIB === 0 ? `${bytes / MIB} MiB` : `${bytes} bytes`);

/**
 * Reads at most `maxBytes` of the body. `truncated` is true when the read stopped at the cap,
 * so an unfound phrase may sit in the unread remainder.
 */
async function readCapped(res, maxBytes = PHRASE_MAX_BYTES) {
  if (!res.body) return { text: await res.text(), truncated: false };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (bytes >= maxBytes) {
      truncated = true;
      await reader.cancel();
      break;
    }
  }
  return { text: text + decoder.decode(), truncated };
}

/** True when a source's phrases should be looked for: a claim source whose status check passed and which has a phrase. */
export function needsPhraseCheck(result) {
  return result.state === "ok" && result.kind === "claim" && (result.phrases?.length ?? 0) > 0;
}

/**
 * Looks for each stored phrase in the live page (read only, one GET). The answer is
 * "found", "missing" (informational, never broken) or "not_checkable" (not text, an error status,
 * a failed request, or a page larger than the read cap whose phrase was not in the part read).
 * It is only called for sources whose status check passed.
 */
export async function checkPhrases(
  source,
  { throttle, fetchImpl = fetch, maxBytes = PHRASE_MAX_BYTES } = {},
) {
  const phrases = source.phrases ?? [];
  if (!phrases.length) return null;
  try {
    await throttle?.wait(source.url);
    const res = await fetchImpl(source.url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, accept: "text/html,text/plain;q=0.9" },
      signal: AbortSignal.timeout(20000),
    });
    if (res.status < 200 || res.status > 299) {
      await res.body?.cancel();
      return { status: "not_checkable", reason: `HTTP ${res.status}`, missing: [] };
    }
    const type = res.headers.get("content-type") ?? "";
    if (!isCheckableContentType(type)) {
      await res.body?.cancel();
      return {
        status: "not_checkable",
        reason: `content type ${type.split(";")[0] || "unknown"}`,
        missing: [],
      };
    }
    const { text: html, truncated } = await readCapped(res, maxBytes);
    const missing = phrases.filter((p) => !containsPhrase(html, p));
    if (!missing.length) return { status: "found", reason: "", missing: [] };
    if (truncated) {
      return {
        status: "not_checkable",
        reason: `page larger than ${formatCap(maxBytes)}, phrase not in the part read`,
        missing: [],
      };
    }
    return { status: "missing", reason: "phrase not in the page", missing };
  } catch (error) {
    return { status: "not_checkable", reason: describeError(error), missing: [] };
  }
}

/**
 * Whether to ask the Internet Archive to save a page. Only claim sources are saved, never when
 * an archive URL is already stored or a snapshot newer than 180 days exists.
 * `snapshotTimestamp` is the Availability API's YYYYMMDDhhmmss string.
 */
export function shouldArchive({ kind, storedArchiveUrl, snapshotTimestamp, now = Date.now() }) {
  if (kind !== "claim") return false;
  if (storedArchiveUrl) return false;
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(snapshotTimestamp ?? "");
  if (m) {
    const taken = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (now - taken < SNAPSHOT_MAX_AGE_DAYS * 86400000) return false;
  }
  return true;
}

// ------------------------------------------------------------------- report

const where = (usage) => `${usage.owner.name} (${usage.owner.type}), ${usage.label}`;

// Everything the issue body lists (state, URL, reason and new destination), so any change while an
// issue is open earns a comment. The run date and newly archived copies are left out on purpose.
function digestLines(report) {
  const lines = [];
  // Stable parts only: the human reason can carry addresses and ports that change every run.
  const tail = (r) => `${r.reasonCode ?? r.reason}${r.movedTo ? ` now at ${r.movedTo}` : ""}`;
  for (const r of report.results) {
    if (r.state === "broken" || r.state === "unverified") lines.push(`${r.state} ${r.url} ${tail(r)}`);
    else if (r.movedTo) lines.push(`moved ${r.url} ${tail(r)}`);
  }
  for (const a of report.archiveFailures ?? [])
    lines.push(`archive-failed ${a.url} ${a.reasonCode ?? a.reason}`);
  return lines.sort();
}

/** A short fingerprint of what the body lists, so an unchanged list does not post a new comment. */
export function digestOf(report) {
  return createHash("sha256").update(digestLines(report).join("\n")).digest("hex").slice(0, 16);
}

/** Only a broken source is a problem that opens, or keeps open, the issue. */
export function hasProblems(report) {
  return report.results.some((r) => r.state === "broken");
}

function section(title, intro, items) {
  if (!items.length) return "";
  return `## ${title} (${items.length})\n\n${intro}\n\n${items.join("\n")}\n\n`;
}

/**
 * The Markdown body of the weekly issue. Each entry names the stop, case study or Lab project
 * and the link label, so the owner knows what to fix. No dashes between words (decision 0014).
 */
export function renderIssueBody(report) {
  const entry = (r) =>
    `- <${r.url}>: ${r.reason}${r.movedTo ? `, now at <${r.movedTo}>` : ""}\n` +
    r.usages.map((u) => `  - ${where(u)}`).join("\n");
  const broken = report.results.filter((r) => r.state === "broken").map(entry);
  const unverified = report.results.filter((r) => r.state === "unverified").map(entry);
  const moved = report.results.filter((r) => r.state === "ok" && r.movedTo).map(entry);
  const phraseEntry = (r) =>
    `- <${r.url}>: ${r.phrase.reason}\n` +
    (r.phrase.missing ?? []).map((p) => `  - missing: "${p}"`).join("\n") +
    ((r.phrase.missing ?? []).length ? "\n" : "") +
    r.usages.map((u) => `  - ${where(u)}`).join("\n");
  const phraseMissing = report.results.filter((r) => r.phrase?.status === "missing").map(phraseEntry);
  const phraseUncheckable = report.results
    .filter((r) => r.phrase?.status === "not_checkable")
    .map(phraseEntry);
  const archiveFailed = (report.archiveFailures ?? []).map((a) => `- <${a.url}>: ${a.reason}`);
  const archived = (report.archived ?? []).map((a) => `- <${a.url}>: <${a.snapshotUrl}>`);
  const checked = `${report.results.length} sources checked on ${report.date}.`;
  return (
    `${checked}\n\n` +
    section(
      "Broken",
      "The page is gone or the host does not exist. Find another public source or a new location, then ship it as a content migration.",
      broken,
    ) +
    section(
      "Could not verify",
      "Informational. The site refused or limited an automated request, or the check failed. Open these by hand. Not counted as broken.",
      unverified,
    ) +
    section(
      "Phrase missing",
      "Informational. The page answered but no longer contains the stored phrase. Open the page and check the claim still stands. Not counted as broken.",
      phraseMissing,
    ) +
    section(
      "Phrase not checkable",
      "Informational. The stored phrase could not be looked for (not an HTML or text page, an error status, or the request failed).",
      phraseUncheckable,
    ) +
    section(
      "Archive save failed",
      "Informational. The Internet Archive did not save these. Never counted as broken.",
      archiveFailed,
    ) +
    section("Moved", "Informational. The final host differs from the stored link.", moved) +
    section("Archived this run", "Informational. Copies saved to the Internet Archive.", archived) +
    `<!-- ${DIGEST_MARKER}: ${digestOf(report)} -->\n`
  );
}

const digestFromBody = (body) => new RegExp(`${DIGEST_MARKER}: ([0-9a-f]+)`).exec(body ?? "")?.[1] ?? null;

/**
 * What to do with the weekly issue. `existing` is the open issue with this title and label, or
 * null. It never closes anything when the database read failed or no sources were found.
 */
export function planIssueAction({ existing, report, readFailed = false }) {
  if (readFailed || report.results.length === 0) return { action: "none", reason: "no trustworthy data" };
  const problems = hasProblems(report);
  if (!existing) return problems ? { action: "create" } : { action: "none", reason: "clean" };
  if (!problems) return { action: "comment_close", number: existing.number };
  return digestFromBody(existing.body) === digestOf(report)
    ? { action: "update", number: existing.number }
    : { action: "update_comment", number: existing.number };
}

// ---------------------------------------------------------------- I/O (main)

async function fetchRows(base, key, path) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Database read failed for ${path.split("?")[0]}: HTTP ${res.status}`);
  return res.json();
}

async function readDatabase(base, key) {
  const [stops, caseStudies, labProjects, outcomes] = await Promise.all([
    fetchRows(base, key, "stops?select=id,slug,name,detail_sources"),
    fetchRows(base, key, "case_studies?select=id,slug,title"),
    fetchRows(base, key, "lab_projects?select=id,slug,name,repo_url,live_url,demo_url,video_url,writeup_url"),
    fetchRows(
      base,
      key,
      "outcomes?select=figure,source_kind,source_label,source_url,source_phrase,source_archive_url,stop_id,case_study_id,lab_project_id&source_kind=eq.link",
    ),
  ]);
  // The site always has stops, Lab projects and sourced figures. An empty answer means the read
  // was blocked or the project is wrong, so it must never look like "all clean".
  for (const [name, rows] of [
    ["stops", stops],
    ["lab_projects", labProjects],
    ["outcomes", outcomes],
  ]) {
    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error(`Database read returned no rows for ${name}`);
  }
  console.log(
    `Read ${stops.length} stops, ${caseStudies.length} case studies, ${labProjects.length} Lab projects, ${outcomes.length} sourced figures.`,
  );
  return { stops, caseStudies, labProjects, outcomes };
}

/**
 * Checks one source: up to three attempts. HEAD first; GET whenever HEAD says 405, 501 or any
 * 4xx or 5xx, because some hosts answer HEAD wrongly, and the verdict comes from the GET.
 */
export async function checkOne(source, { throttle, sleep = defaultSleep, fetchImpl = fetch } = {}) {
  const maxAttempts = 3;
  const headers = { "user-agent": USER_AGENT };
  let verdict;
  // 404 and 410 are final at once. A 5xx or DNS failure is broken only when every attempt failed
  // that way, so a rate limit or timeout on an earlier attempt makes the result "could not verify".
  let definitive = false;
  const attempts = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const lastAttempt = attempt === maxAttempts;
    let retryAfter = null;
    definitive = false;
    await throttle?.wait(source.url);
    try {
      let res = await fetchImpl(source.url, {
        method: "HEAD",
        redirect: "follow",
        headers,
        signal: AbortSignal.timeout(20000),
      });
      if (res.status >= 400 && res.status !== 429) {
        await throttle?.wait(source.url);
        res = await fetchImpl(source.url, {
          method: "GET",
          redirect: "follow",
          headers,
          signal: AbortSignal.timeout(20000),
        });
        await res.body?.cancel();
      }
      retryAfter = res.headers.get("retry-after");
      verdict = classifyResponse({ status: res.status, url: source.url, finalUrl: res.url, lastAttempt });
      definitive = res.status === 404 || res.status === 410;
    } catch (error) {
      verdict = classifyError(error, { lastAttempt });
    }
    attempts.push(verdict);
    if (!verdict.retry) break;
    await sleep(retryDelay(attempt, retryAfter));
  }
  if (verdict.state === "broken" && !definitive && attempts.some((v) => v.state !== "broken")) {
    verdict = {
      ...verdict,
      state: "unverified",
      reason: `mixed failures: ${attempts.map((v) => v.reason).join(", ")}`,
    };
  }
  return { ...source, ...verdict };
}

/** The newest usable snapshot (available and a 2xx capture), or null. */
export async function latestSnapshot(url, fetchImpl = fetch) {
  const res = await fetchImpl(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok)
    throw Object.assign(new Error(`Availability API HTTP ${res.status}`), {
      code: `AVAILABILITY_HTTP_${res.status}`,
    });
  const closest = (await res.json())?.archived_snapshots?.closest;
  return closest?.available === true && /^2\d\d$/.test(String(closest.status)) ? closest : null;
}

// Anonymous Save Page Now: GET https://web.archive.org/save/<url>. The published SPN2 document
// shows this request with cookies; reading the snapshot address from Content-Location (or the
// Link header's rel="memento", or the final URL) is observed behaviour, not published API, and
// the first manual run is the evidence. Any failure is reported, never fatal.
export async function saveSnapshot(url, fetchImpl = fetch) {
  const res = await fetchImpl(`https://web.archive.org/save/${url}`, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(120000),
  });
  await res.body?.cancel();
  const memento = /<([^>]+)>;\s*rel="[^"]*memento[^"]*"/.exec(res.headers.get("link") ?? "")?.[1];
  const candidates = [res.headers.get("content-location"), memento, res.url].filter(Boolean);
  const found = candidates
    .map((c) => new URL(c, "https://web.archive.org").href)
    .find((c) => /\/web\/\d{14}/.test(c));
  if (!res.ok || !found)
    throw Object.assign(new Error(`HTTP ${res.status}, no snapshot address`), {
      code: `SAVE_HTTP_${res.status}`,
    });
  return found;
}

/**
 * Saves claim sources that have no recent snapshot: 25 s apart, at most 10 a run. Every outcome
 * is logged on one line, so the run log alone shows what happened.
 */
export async function archiveClaims(
  results,
  { sleep = defaultSleep, fetchImpl = fetch, log = console.log } = {},
) {
  const archived = [];
  const archiveFailures = [];
  const skipped = [];
  const skip = (url, reason) => {
    skipped.push({ url, reason });
    log(`archive skipped ${url} (${reason})`);
  };
  let saves = 0;
  for (const r of results) {
    if (r.kind !== "claim") {
      skip(r.url, "own source");
      continue;
    }
    if (r.state === "broken") {
      skip(r.url, "broken");
      continue;
    }
    if (r.archiveUrl) {
      skip(r.url, "archive copy stored");
      continue;
    }
    if (saves >= MAX_ARCHIVE_PER_RUN) {
      skip(r.url, "cap reached");
      continue;
    }
    const started = Date.now();
    try {
      const snap = await latestSnapshot(r.url, fetchImpl);
      log(`availability ${r.url}: ${snap ? `${snap.timestamp} ${snap.url}` : "no usable snapshot"}`);
      if (!shouldArchive({ kind: r.kind, snapshotTimestamp: snap?.timestamp })) {
        skip(r.url, "recent snapshot");
        continue;
      }
      if (saves > 0) await sleep(ARCHIVE_GAP_MS);
      saves++;
      const snapshotUrl = await saveSnapshot(r.url, fetchImpl);
      archived.push({ url: r.url, snapshotUrl });
      log(`archive saved ${r.url} -> ${snapshotUrl}`);
    } catch (error) {
      const reason = describeError(error);
      archiveFailures.push({ url: r.url, reason, reasonCode: errorCode(error) });
      log(`archive failed ${r.url}: ${reason} after ${Date.now() - started} ms`);
    }
  }
  return { archived, archiveFailures, skipped };
}

async function github(path, init = {}, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": USER_AGENT,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GitHub ${init.method ?? "GET"} ${path} failed: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/** The open issue with the exact title and label. Pull requests also appear in this list; skipped. */
export async function findIssue(fetchImpl = fetch) {
  const issues = await github(`/issues?labels=${ISSUE_LABEL}&state=open&per_page=100`, {}, fetchImpl);
  return issues.find((i) => !i.pull_request && i.title === ISSUE_TITLE) ?? null;
}

async function applyPlan(plan, report) {
  const body = renderIssueBody(report);
  const post = (path, method, data) => github(path, { method, body: JSON.stringify(data) });
  if (plan.action === "create")
    await post("/issues", "POST", { title: ISSUE_TITLE, body, labels: [ISSUE_LABEL] });
  else if (plan.action === "update") await post(`/issues/${plan.number}`, "PATCH", { body });
  else if (plan.action === "update_comment") {
    await post(`/issues/${plan.number}`, "PATCH", { body });
    await post(`/issues/${plan.number}/comments`, "POST", {
      body: "The list changed. The description is updated.",
    });
  } else if (plan.action === "comment_close") {
    await post(`/issues/${plan.number}/comments`, "POST", {
      body: "No broken source this week. Closing. Could not verify and archive entries stay in the job summary.",
    });
    await post(`/issues/${plan.number}`, "PATCH", { state: "closed", state_reason: "completed" });
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  const sleep = defaultSleep;
  const date = new Date().toISOString().slice(0, 10);
  let report = { results: [], date };
  let readFailed = false;

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("SUPABASE_URL and SUPABASE_KEY are required");
    const rows = await readDatabase(SUPABASE_URL, SUPABASE_KEY);
    if (collectSources(rows).length === 0) throw new Error("The database held no source links");
    const sources = collectSources(rows, STATIC_SOURCES);
    console.log(`Checking ${sources.length} sources.`);
    const throttle = createHostThrottle();
    const results = [];
    for (const source of sources) {
      const result = await checkOne(source, { throttle, sleep });
      console.log(`${result.state.padEnd(10)} ${result.url} (${result.reason})`);
      if (needsPhraseCheck(result)) {
        result.phrase = await checkPhrases(result, { throttle });
        console.log(
          `phrase ${result.phrase.status} ${result.url}${result.phrase.reason ? ` (${result.phrase.reason})` : ""}`,
        );
      }
      results.push(result);
    }
    const archive = await archiveClaims(results, { sleep });
    report = { results, date, ...archive };
  } catch (error) {
    readFailed = true;
    console.error(error instanceof Error ? error.message : error);
  }

  const body = renderIssueBody(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
  if (dryRun) {
    console.log(body);
    return;
  }
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY)
    throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY are required");
  const plan = planIssueAction({ existing: await findIssue(), report, readFailed });
  console.log(`Issue action: ${plan.action}`);
  await applyPlan(plan, report);
  if (readFailed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
