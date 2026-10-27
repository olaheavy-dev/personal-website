import { Route } from "@/components/route/Route";
import { RoutePin, type PinTone } from "@/components/route/RoutePin";
import { WorkStopTicket } from "@/components/work/WorkStopTicket";
import type { WorkRouteEntry } from "@/lib/work/route";

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
// The Toolkit section (Toolkit.tsx) sits in the same two column grid after this list, with
// the rail label "Toolkit".

const railText = "min-w-0 pt-0.5";
const years = "label-mono text-text-secondary";
const roleLine = "mt-1 text-sm leading-snug font-semibold";

function pinTone(last: boolean, current: boolean): PinTone {
  if (last) return "start";
  return current ? "end" : "default";
}

export function WorkRoute({ entries }: { entries: WorkRouteEntry[] }) {
  return (
    <section aria-label="Work, newest first" className="mx-auto w-full max-w-wide px-(--gutter)">
      <Route
        variant="vertical"
        draw="static"
        className="[--route-gap:var(--space-7)] md:[--route-gap:var(--space-8)]"
      >
        <ol role="list" className="grid gap-(--route-gap)">
          {entries.map((entry, index) => {
            const last = index === entries.length - 1;
            const current =
              entry.type === "stop" ? entry.ticket.current : entry.tickets.some((t) => t.current);
            const key = entry.type === "stop" ? entry.ticket.slug : entry.via;
            return (
              <li
                key={key}
                id={entry.type === "stop" ? entry.ticket.slug : undefined}
                data-work-entry={key}
                className="relative grid gap-y-4 md:grid-cols-[var(--work-rail-width-md)_minmax(0,var(--work-ticket-max))] md:gap-x-6 lg:grid-cols-[var(--work-rail-width)_minmax(0,var(--work-ticket-max))] lg:gap-x-10"
              >
                <div
                  className="grid grid-cols-[var(--route-pin-size)_minmax(0,1fr)] gap-x-3"
                  aria-hidden="true"
                >
                  <RoutePin id={key} index={index} tone={pinTone(last, current)} leg={!last} />
                  {entry.type === "stop" ? (
                    <div className={railText} data-rail="">
                      <p className={years}>{entry.ticket.eyebrow.meta}</p>
                      {entry.ticket.eyebrow.role ? (
                        <p className={roleLine}>{entry.ticket.eyebrow.role}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className={railText} data-rail="">
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
