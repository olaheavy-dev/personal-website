// The outcome of a database read. Reads never throw: a missing key, a network error
// or a malformed row comes back as `{ ok: false, reason }`, so a page can show its
// empty state instead of crashing. The values are plain data, safe to cache.

export type FailureReason =
  /** The Supabase environment variables are not set. */
  | "unconfigured"
  /** They are set, but a value is malformed or is a legacy key. */
  | "invalid_config"
  /** The request failed (network, permission, bad query). */
  | "query_failed"
  /** The request worked but a row broke the shape the site expects. */
  | "invalid_data";

export type Failure = { ok: false; reason: FailureReason; message: string };
export type Result<T> = { ok: true; data: T } | Failure;

export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failure(reason: FailureReason, message: string): Failure {
  return { ok: false, reason, message };
}

/** Runs a read and turns anything it throws into a failed result. */
export async function attempt<T>(read: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await read();
  } catch (error) {
    return failure("query_failed", error instanceof Error ? error.message : "Unknown error");
  }
}
