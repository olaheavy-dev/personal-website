import { MetricChip } from "@/components/ticket/MetricChip";
import { Ticket } from "@/components/ticket/Ticket";
import { getFlags } from "@/lib/db/queries/flags";
import { getStops } from "@/lib/db/queries/stops";
import { getViewer } from "@/lib/flags/visibility";
import { buildSelectedStops, type SelectedStopsModel } from "@/lib/home/selected-stops";

// Home section 4: depth on the three strongest proofs, from the database (stops.summary and
// each stop's first sourced outcome). The text lives in the database so the owner can edit it
// without a deploy (issue #9). A read that fails, an empty answer or flags that hide a page
// are all handled in buildSelectedStops, which returns nothing to show.

export function SelectedStopsView({ model }: { model: SelectedStopsModel }) {
  return (
    <section
      id="selected-stops"
      aria-labelledby="selected-stops-title"
      className="mx-auto w-full max-w-wide px-(--gutter) pt-8 pb-12 md:pt-10 md:pb-16"
    >
      <h2 id="selected-stops-title" className="label-mono text-text-tertiary">
        Selected stops
      </h2>
      <ul role="list" className="mt-6 grid gap-8 lg:grid-cols-3 lg:gap-6">
        {model.tickets.map((ticket) => (
          <li key={ticket.slug} className="flex">
            <Ticket
              {...(ticket.href ? { href: ticket.href } : {})}
              title={ticket.title}
              headingLevel={3}
              eyebrow={ticket.eyebrow}
              className="w-full"
              chips={
                ticket.outcome ? (
                  <MetricChip
                    value={ticket.outcome.figure}
                    label={ticket.outcome.description}
                    source={ticket.outcome.source}
                    attribution={ticket.outcome.scope === "company" ? ticket.outcome.attribution : null}
                    year={ticket.outcome.scope === "company" ? ticket.outcome.asOfYear : null}
                  />
                ) : undefined
              }
            >
              {ticket.summary ? (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{ticket.summary}</p>
              ) : null}
            </Ticket>
          </li>
        ))}
      </ul>
      {model.routeLink ? (
        <p className="mt-6">
          <a
            href={model.routeLink}
            className="inline-flex min-h-11 items-center font-medium text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
          >
            See the whole route <span aria-hidden="true">&nbsp;&rarr;</span>
          </a>
        </p>
      ) : null}
    </section>
  );
}

export async function SelectedStops() {
  const [stops, flags, viewer] = await Promise.all([getStops(), getFlags(), getViewer()]);
  const model = buildSelectedStops(stops, flags, viewer);
  return model ? <SelectedStopsView model={model} /> : null;
}
