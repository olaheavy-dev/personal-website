import { MetricChip } from "@/components/ticket/MetricChip";
import { Ticket } from "@/components/ticket/Ticket";
import { TicketEyebrow } from "@/components/ticket/TicketEyebrow";
import { TicketExpander } from "@/components/ticket/TicketExpander";
import type { WorkTicketModel } from "@/lib/work/route";

// One stop on /work. A flagship stop (HBK, Optty, Access Bank) is a large ticket with its sourced
// figure on the stub, and links to its case study only when one is live. A compact stop (Galooli,
// Stanbic IBTC, uLesson, Mukuru) shows its summary and expands to its details and outcome.
// Server component; only the expander is a client component.

function Figure({ ticket }: { ticket: WorkTicketModel }) {
  const { outcome } = ticket;
  if (!outcome) return null;
  return (
    <MetricChip
      value={outcome.figure}
      label={outcome.description}
      source={outcome.source}
      attribution={outcome.scope === "company" ? outcome.attribution : null}
    />
  );
}

export function WorkStopTicket({ ticket, headingLevel }: { ticket: WorkTicketModel; headingLevel: 2 | 3 }) {
  const summary = ticket.summary ? (
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{ticket.summary}</p>
  ) : null;
  const eyebrow = <TicketEyebrow {...ticket.eyebrow} />;
  const link = ticket.href ? { href: ticket.href } : {};

  if (ticket.kind === "flagship") {
    return (
      <Ticket
        {...link}
        title={ticket.title}
        headingLevel={headingLevel}
        eyebrow={eyebrow}
        bodyPadding="flex-1 px-6 pt-5 pb-5"
        stub={ticket.outcome ? <Figure ticket={ticket} /> : undefined}
      >
        {summary}
      </Ticket>
    );
  }

  const hasMore = ticket.details.length > 0 || ticket.outcome != null;
  return (
    <Ticket {...link} size="compact" title={ticket.title} headingLevel={headingLevel} eyebrow={eyebrow}>
      {summary}
      {hasMore ? (
        <TicketExpander anchorId={ticket.slug} subject={ticket.title}>
          {ticket.details.length > 0 ? (
            <ul role="list" className="mt-3 grid gap-2 text-sm leading-relaxed text-text-secondary">
              {ticket.details.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-lilac" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {ticket.outcome ? (
            <div className="mt-2">
              <Figure ticket={ticket} />
            </div>
          ) : null}
        </TicketExpander>
      ) : null}
    </Ticket>
  );
}
