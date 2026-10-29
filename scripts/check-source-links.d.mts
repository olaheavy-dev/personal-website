// Types for check-source-links.mjs, so its tests can import it from TypeScript.
export type Owner = { type: string; name: string; slug?: string };
export type Usage = { owner: Owner; label: string };
export type Source = { url: string; kind: "claim" | "own"; usages: Usage[] };
export type State = "ok" | "broken" | "unverified";
export type Verdict = {
  state: State;
  reason: string;
  reasonCode?: string;
  retry: boolean;
  movedTo: string | null;
};
export type Result = Source & Verdict;
export type Report = {
  date: string;
  results: Result[];
  archived?: { url: string; snapshotUrl: string }[];
  archiveFailures?: { url: string; reason: string; reasonCode?: string }[];
};
export type Rows = {
  stops?: Record<string, unknown>[];
  caseStudies?: Record<string, unknown>[];
  labProjects?: Record<string, unknown>[];
  outcomes?: Record<string, unknown>[];
};
export const ISSUE_TITLE: string;
export const ISSUE_LABEL: string;
export const USER_AGENT: string;
export const REQUEST_GAP_MS: number;
export const ARCHIVE_GAP_MS: number;
export const RETRY_CAP_MS: number;
export const MAX_ARCHIVE_PER_RUN: number;
export const SNAPSHOT_MAX_AGE_DAYS: number;
export const STATIC_SOURCES: { url: string; label: string; kind: "claim" | "own"; owner: Owner }[];
export function collectSources(
  rows: Rows,
  staticSources?: { url: string; label: string; kind: "claim" | "own"; owner: Owner }[],
): Source[];
export function isOwnUrl(url: string): boolean;
export function errorCode(error: unknown): string;
export function describeError(error: unknown): string;
export function classifyResponse(input: {
  status: number;
  url: string;
  finalUrl?: string;
  lastAttempt?: boolean;
}): Verdict;
export function classifyError(error: unknown, options?: { lastAttempt?: boolean }): Verdict;
export function retryDelay(attempt: number, retryAfter?: string | null, now?: number): number;
export function createHostThrottle(options?: {
  minGapMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): { wait(url: string): Promise<void> };
export function containsPhrase(html: string, phrase: string): boolean;
export function shouldArchive(input: {
  kind: string;
  storedArchiveUrl?: string | null;
  snapshotTimestamp?: string | null;
  now?: number;
}): boolean;
export function digestOf(report: Report): string;
export function hasProblems(report: Report): boolean;
export function renderIssueBody(report: Report): string;
export function planIssueAction(input: {
  existing: { number: number; body?: string | null } | null;
  report: Report;
  readFailed?: boolean;
}): {
  action: "none" | "create" | "update" | "update_comment" | "comment_close";
  number?: number;
  reason?: string;
};
type FetchImpl = typeof fetch;
export function checkOne(
  source: Source,
  options?: {
    throttle?: { wait(url: string): Promise<void> };
    sleep?: (ms: number) => Promise<void>;
    fetchImpl?: FetchImpl;
  },
): Promise<Result>;
export function latestSnapshot(
  url: string,
  fetchImpl?: FetchImpl,
): Promise<{ timestamp: string; url: string } | null>;
export function saveSnapshot(url: string, fetchImpl?: FetchImpl): Promise<string>;
export function archiveClaims(
  results: Result[],
  options?: { sleep?: (ms: number) => Promise<void>; fetchImpl?: FetchImpl; log?: (line: string) => void },
): Promise<{
  archived: { url: string; snapshotUrl: string }[];
  archiveFailures: { url: string; reason: string; reasonCode?: string }[];
  skipped: { url: string; reason: string; reasonCode?: string }[];
}>;
export function findIssue(
  fetchImpl?: FetchImpl,
): Promise<{ number: number; title: string; body?: string | null } | null>;
