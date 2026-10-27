import type { WorkRouteEntry, WorkRouteModel } from "./route";

// Which vehicles the Work route shows, and where, worked out from the model. Pure, so every rule
// is a plain unit test (issue #66).
//
// The route lists stops newest first. The danfo drives the Lagos part of the rail (an entry is
// Lagos when its era is "lagos"), the paper plane flies the handover leg (the leg that leaves the
// handover's UK entry and arrives at the Lagos entry it came from, nose towards the UK stop), and
// the London bus waits beside the UK entry the handover arrives at.

export type WorkVehiclePlan = {
  /** Entry keys (the same keys WorkRoute uses for pin ids) a danfo can park beside, top of the page first. */
  danfoAt: string[];
  /** The danfo's rest place without motion or JavaScript: the Lagos entry nearest the UK, or null. */
  danfoHome: string | null;
  /** The entry the bus waits beside, and the plane leaves from (the UK end of the handover), or null. */
  busAt: string | null;
  /** The entry whose leg the plane rides: the UK entry, when the next entry down is the Lagos end. */
  planeLegAt: string | null;
};

export function entryKey(entry: WorkRouteEntry): string {
  return entry.type === "stop" ? entry.ticket.slug : entry.via;
}

const slugsOf = (entry: WorkRouteEntry) =>
  entry.type === "stop" ? [entry.ticket.slug] : entry.tickets.map((t) => t.slug);

const eraOf = (entry: WorkRouteEntry) => (entry.type === "stop" ? entry.ticket.era : entry.tickets[0]?.era);

export function planWorkVehicles({
  entries,
  handover,
}: Pick<Extract<WorkRouteModel, { unavailable: false }>, "entries" | "handover">): WorkVehiclePlan {
  const danfoAt = entries.filter((entry) => eraOf(entry) === "lagos").map(entryKey);

  const toIndex = handover ? entries.findIndex((entry) => slugsOf(entry).includes(handover.toSlug)) : -1;
  const fromIndex = handover ? entries.findIndex((entry) => slugsOf(entry).includes(handover.fromSlug)) : -1;
  const found = toIndex >= 0 && fromIndex >= 0;
  return {
    danfoAt,
    danfoHome: danfoAt[0] ?? null,
    busAt: found ? entryKey(entries[toIndex]!) : null,
    // The plane needs a leg between the two entries: they must be neighbours.
    planeLegAt: found && fromIndex === toIndex + 1 ? entryKey(entries[toIndex]!) : null,
  };
}
