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

// Every company name uses this one size, flagship or compact (owner decision, 27 Oct 2026).
const titleSize = "font-display text-display-sm leading-snug tracking-tight";

export function WorkStopTicket({
  ticket,
  headingLevel,
  showEyebrow = false,
  spoken = false,
}: {
  ticket: WorkTicketModel;
  headingLevel: 2 | 3;
  /** Only a consultancy's client ("via Deimos") has an eyebrow: the rail shows every other stop's role and years. */
  showEyebrow?: boolean;
  /** Say the stop's years and role to a screen reader, right after the title: the visible rail beside the ticket is hidden from it. */
  spoken?: boolean;
}) {
  const said = spoken ? (
    <p className="sr-only">{[ticket.eyebrow.meta, ticket.eyebrow.role].filter(Boolean).join(", ")}</p>
  ) : null;
  const summary = ticket.summary ? (
    <p className="mt-2 max-w-(--max-width-content) text-sm leading-relaxed text-pretty text-text-secondary">
      {ticket.summary}
    </p>
  ) : null;
  const eyebrow = showEyebrow ? <TicketEyebrow {...ticket.eyebrow} /> : undefined;
  const titleClassName = `${eyebrow ? "mt-3 " : ""}${titleSize}`;
  const link = ticket.href ? { href: ticket.href } : {};

  if (ticket.kind === "flagship") {
    return (
      <Ticket
        {...link}
        title={ticket.title}
        headingLevel={headingLevel}
        eyebrow={eyebrow}
        titleClassName={titleClassName}
        bodyPadding="flex-1 px-6 pt-5 pb-5"
        stub={ticket.outcome ? <Figure ticket={ticket} /> : undefined}
      >
        {said}
        {summary}
      </Ticket>
    );
  }

  const hasMore = ticket.details.length > 0 || ticket.outcome != null;
  return (
    <Ticket
      {...link}
      size="compact"
      title={ticket.title}
      headingLevel={headingLevel}
      eyebrow={eyebrow}
      titleClassName={titleClassName}
      bodyPadding="px-6 pt-5 pb-5"
    >
      {said}
      {summary}
      {hasMore ? (
        <TicketExpander anchorId={ticket.slug} subject={ticket.title}>
          {ticket.details.length > 0 ? (
            <ul role="list" className="mt-3 grid gap-2 text-sm leading-relaxed text-text-secondary">
              {ticket.details.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-lilac" />
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
