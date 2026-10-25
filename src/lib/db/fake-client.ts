import type { DbClient } from "./public-client";

// A stand-in for the Supabase client in unit tests. Every builder call returns the same
// query object, and awaiting it (or calling maybeSingle) gives the canned response.
// Test helper only: nothing in the app imports this file.

export type FakeResponse = { data: unknown; error: { message: string } | null };

export function fakeClient(response: FakeResponse) {
  const result = Promise.resolve(response);
  const query: Record<string, unknown> = {};
  for (const method of ["select", "order", "eq"]) query[method] = vi.fn(() => query);
  query.maybeSingle = vi.fn(() => result);
  query.then = result.then.bind(result);
  const from = vi.fn(() => query);
  return { client: { from } as unknown as DbClient, from, query };
}
