import type { Stop } from "@/lib/db/types";

/** A ticket eyebrow in two lines: the role, then the meta line. Role is null when there is none. */
export type StopEyebrow = { role: string | null; meta: string };

/**
 * The ticket's mono eyebrow, from the owner's CV: role "Technical Support Engineer" over
 * "2016 to 2018", and "2024 to now" while the stop is current. A stop with no role shows the
 * years only. A client stop of a consultancy (owner decision, 27 Oct 2026) shows only "via
 * Deimos": no role and no years, because those describe the Deimos job and appear once, in the
 * Deimos group heading on /work (see `deimosGroupHeading`).
 */
export function stopEyebrow(stop: Pick<Stop, "role" | "via" | "startYear" | "endYear">): StopEyebrow {
  if (stop.via) return { role: null, meta: `via ${stop.via}` };
  const years = `${stop.startYear} to ${stop.endYear ?? "now"}`;
  return { role: stop.role || null, meta: years };
}
