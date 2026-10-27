import type { Stop } from "@/lib/db/types";

// Deimos is the consultancy three of the owner's clients came through. On /work they sit under
// one group heading, and each client ticket says only "via Deimos" (owner decision, 27 Oct
// 2026). The role and years belong to the Deimos job, so they appear once, here, and are
// worked out from the client rows rather than typed a second time.

type DeimosRow = Pick<Stop, "role" | "via" | "startYear" | "endYear">;

/** The consultancy's name and, when every row agrees, the role and the years of the job. */
export function deimosGroupParts(rows: readonly DeimosRow[]): {
  name: string;
  role: string | null;
  years: string | null;
} {
  const name = rows.find((row) => row.via)?.via ?? "Deimos";
  if (rows.length === 0) return { name, role: null, years: null };
  const role = rows[0]!.role;
  const agree = rows.every((row) => row.via === rows[0]!.via && row.role === role);
  if (!agree || !role) return { name, role: null, years: null };
  const start = Math.min(...rows.map((row) => row.startYear));
  const ends = rows.map((row) => row.endYear);
  const end = ends.some((year) => year === null) ? "now" : String(Math.max(...(ends as number[])));
  return { name, role, years: `${start} to ${end}` };
}

/**
 * "Deimos · Senior Software Engineer · 2022 to 2024": the consultancy's name, the role the rows
 * share, then the earliest start and the latest end ("now" while any row is current). When the
 * rows are empty, have no role, or disagree on the consultancy or the role, only the name is
 * safe to say, so the heading falls back to the name alone ("Deimos").
 */
export function deimosGroupHeading(rows: readonly DeimosRow[]): string {
  const { name, role, years } = deimosGroupParts(rows);
  return role && years ? `${name} · ${role} · ${years}` : name;
}
