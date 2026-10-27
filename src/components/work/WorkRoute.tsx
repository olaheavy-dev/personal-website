import { WorkStopTicket } from "@/components/work/WorkStopTicket";
import type { WorkRouteEntry } from "@/lib/work/route";

// The Work list: every stop as a ticket, newest first. A consultancy's client stops (Deimos)
// sit together under one heading, so the role and years appear once. Each stop is an
// `<li id={slug}>`, the anchor home's tickets link to (/work#mukuru). Server component.

export function WorkRoute({ entries }: { entries: WorkRouteEntry[] }) {
  return (
    <section aria-label="Work, newest first" className="mx-auto w-full max-w-wide px-(--gutter)">
      <ol role="list" className="grid gap-8 md:gap-10">
        {entries.map((entry) =>
          entry.type === "stop" ? (
            <li key={entry.ticket.slug} id={entry.ticket.slug} data-work-stop={entry.ticket.slug}>
              <WorkStopTicket ticket={entry.ticket} headingLevel={2} />
            </li>
          ) : (
            <li key={entry.via} data-work-group={entry.via}>
              <h2 className="font-display text-xl leading-snug tracking-tight">{entry.heading}</h2>
              <ol role="list" className="mt-4 grid gap-6 border-l-2 border-border-strong pl-4 md:pl-6">
                {entry.tickets.map((ticket) => (
                  <li key={ticket.slug} id={ticket.slug} data-work-stop={ticket.slug}>
                    <WorkStopTicket ticket={ticket} headingLevel={3} />
                  </li>
                ))}
              </ol>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
