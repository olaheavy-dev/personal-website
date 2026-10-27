import { PlaneVehicle } from "@/components/route/PaperPlane";
import { Route } from "@/components/route/Route";
import { RoutePin, type PinTone } from "@/components/route/RoutePin";
import { ParkedVehicle, VehicleSprites } from "@/components/route/Vehicles";
import { WorkStopTicket } from "@/components/work/WorkStopTicket";
import type { WorkRouteEntry, WorkRouteModel } from "@/lib/work/route";
import { entryKey, planWorkVehicles } from "@/lib/work/vehicles";

// The Work timeline: every stop as a ticket, newest first. From md it is two columns, a rail on
// the left (a dotted route line, one pin per entry, then the years and the role) and the
// ticket(s) on the right. Below md the rail collapses: the pin, years and role sit on one row
// above the ticket(s), and the dotted line runs down the left edge. The route's own leg
// geometry does the line (pin to pin, whatever the row heights), so nothing is measured.
//
// A consultancy's client stops (Deimos) are one rail entry with their tickets stacked beside it,
// each eyebrowed "via Deimos". The whole rail is hidden from assistive technology, because its
// words would read as the end of the previous section: a stop's ticket says its own years and
// role in screen reader only text right after its heading, and the Deimos group's accessible
// name is a screen reader only h2 (the heading says the same words).
//
// Each stop is an `<li id={slug}>`, the anchor home's tickets link to (/work#mukuru); inside the
// Deimos group each client ticket has its own `li`.
//
// The Deimos entry's pin id is the consultancy's name, "Deimos", not a slug (it has no anchor).
//
// Vehicles (issue #66, src/lib/work/vehicles.ts): one danfo drives the Lagos entries (it shows at
// the Lagos entry the reader is at, following them up and down, its door open), the paper plane rides the handover
// leg from the Deimos entry up to HBK, and the London bus waits beside HBK. Each is placed in the
// rail with no layout effect (absolute, transform and opacity only), and without motion or
// JavaScript the danfo is parked at the Deimos entry with its door open.
//
// The Toolkit section (Toolkit.tsx) sits in the same two column grid after this list, with
// the rail label "Toolkit".

const railText = "relative min-w-0 self-start pt-0.5";
const years = "label-mono text-text-secondary";
const roleLine = "mt-1 text-sm leading-snug font-semibold";

// The parked vehicle for this entry, if it has one: the danfo at a Lagos entry, the bus at HBK.
function ParkedFor({
  keyName,
  plan,
  tone,
}: {
  keyName: string;
  plan: ReturnType<typeof planWorkVehicles>;
  tone: PinTone;
}) {
  // On phones the disc covers the pin, so it keeps the colour of the first and current pins.
  const ring = tone === "start" || tone === "end" ? tone : undefined;
  if (plan.danfoAt.includes(keyName)) {
    return <ParkedVehicle kind="danfo" at={keyName} home={keyName === plan.danfoHome} ring={ring} />;
  }
  if (keyName === plan.busAt) return <ParkedVehicle kind="bus" at={keyName} home ring={ring} />;
  return null;
}

function pinTone(last: boolean, current: boolean): PinTone {
  if (last) return "start";
  return current ? "end" : "default";
}

type WorkRouteProps = {
  entries: WorkRouteEntry[];
  handover?: Extract<WorkRouteModel, { unavailable: false }>["handover"];
};

export function WorkRoute({ entries, handover = null }: WorkRouteProps) {
  const plan = planWorkVehicles({ entries, handover });
  return (
    <section aria-label="Work, newest first" className="mx-auto w-full max-w-wide px-(--gutter)">
      <VehicleSprites />
      <Route
        variant="vertical"
        draw="progressive"
        className="[--route-gap:var(--space-7)] [--route-rail-gap:var(--space-3)] md:[--route-gap:var(--space-8)]"
      >
        <ol role="list" className="grid gap-(--route-gap)">
          {entries.map((entry, index) => {
            const last = index === entries.length - 1;
            const current =
              entry.type === "stop" ? entry.ticket.current : entry.tickets.some((t) => t.current);
            const key = entryKey(entry);
            return (
              <li
                key={key}
                id={entry.type === "stop" ? entry.ticket.slug : undefined}
                data-work-entry={key}
                className="relative grid gap-y-4 md:grid-cols-[var(--work-rail-width-md)_minmax(0,var(--work-ticket-max))] md:gap-x-6 lg:grid-cols-[var(--work-rail-width)_minmax(0,var(--work-ticket-max))] lg:gap-x-10"
              >
                <div
                  className="grid grid-cols-[var(--route-pin-size)_minmax(0,1fr)] gap-x-(--route-rail-gap)"
                  aria-hidden="true"
                >
                  <RoutePin
                    id={key}
                    index={index}
                    tone={pinTone(last, current)}
                    leg={!last}
                    park={plan.danfoAt.includes(key) ? "danfo" : key === plan.busAt ? "bus" : undefined}
                    vehicle={key === plan.planeLegAt ? <PlaneVehicle /> : undefined}
                    vehicleDirection="up"
                  />
                  {entry.type === "stop" ? (
                    <div className={railText} data-rail="">
                      <ParkedFor keyName={key} plan={plan} tone={pinTone(last, current)} />
                      <p className={years}>{entry.ticket.eyebrow.meta}</p>
                      {entry.ticket.eyebrow.role ? (
                        <p className={roleLine}>{entry.ticket.eyebrow.role}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className={railText} data-rail="">
                      <ParkedFor keyName={key} plan={plan} tone={pinTone(last, current)} />
                      {entry.years ? <p className={years}>{entry.years}</p> : null}
                      {entry.role ? <p className={roleLine}>{entry.role}</p> : null}
                      <p className="label-mono mt-1 text-lilac-text">
                        {entry.via} · {entry.tickets.length} clients
                      </p>
                    </div>
                  )}
                </div>
                {entry.type === "stop" ? (
                  <div className="pl-7 md:pl-0" data-work-stop={entry.ticket.slug}>
                    <WorkStopTicket ticket={entry.ticket} headingLevel={2} spoken />
                  </div>
                ) : (
                  <>
                    <h2 className="sr-only">{entry.heading.replaceAll(" · ", ", ")}</h2>
                    <ol role="list" className="grid gap-4 pl-7 md:col-start-2 md:pl-0">
                      {entry.tickets.map((ticket) => (
                        <li key={ticket.slug} id={ticket.slug} data-work-stop={ticket.slug}>
                          <WorkStopTicket ticket={ticket} headingLevel={3} showEyebrow />
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </Route>
    </section>
  );
}
