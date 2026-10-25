export type FakeOutcome = {
  figure: string;
  description: string;
  source_label: string | null;
  source_url: string | null;
  attribution: string | null;
  as_of_year: number | null;
  claim_scope: string;
};
export type FakeRow = {
  slug: string;
  name: string;
  summary: string | null;
  status: string;
  outcomes: FakeOutcome[];
  [column: string]: unknown;
};
export type ContentMode = "ok" | "empty" | "error";
export const stops: FakeRow[];
export const labProjects: FakeRow[];
export function contentAnswer(table: string, mode: ContentMode): { status: number; body: unknown } | null;
