import { MetricChip } from "@/components/ticket/MetricChip";
import { Ticket } from "@/components/ticket/Ticket";
import { TicketEyebrow } from "@/components/ticket/TicketEyebrow";
import { TicketExpander } from "@/components/ticket/TicketExpander";
import type { WorkTicketModel } from "@/lib/work/route";

// One stop on /work. A flagship stop (HBK, Optty, Access Bank) is a large ticket with its sourced
// figure on the stub, and links to its case study only when one is live. A compact stop (Galooli,
// Stanbic IBTC, uLesson, Mukuru) shows its summary and expands to its details and outcome. A
// flagship with details expands to them too, and any ticket with public sources shows them as a
// "Sources" row under its detail lines. Server component; only the expander is a client component.

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

function DetailLines({ lines }: { lines: string[] }) {
  return (
    <ul role="list" className="mt-3 grid gap-2 text-sm leading-relaxed text-text-secondary">
      {lines.map((line) => (
        <li key={line} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-lilac" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

// The public pages behind the detail lines. Each opens in a new tab and says so in its name,
// which still starts with the visible words (WCAG 2.5.3).
function Sources({ ticket }: { ticket: WorkTicketModel }) {
  if (ticket.sources.length === 0) return null;
  const labelId = `${ticket.slug}-sources`;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5">
      <p id={labelId} className="label-mono text-text-tertiary">
        Sources
      </p>
      <ul role="list" aria-labelledby={labelId} className="flex flex-wrap gap-x-5">
        {ticket.sources.map((source) => {
          const lastSpace = source.label.lastIndexOf(" ");
          const lead = lastSpace === -1 ? "" : source.label.slice(0, lastSpace + 1);
          const lastWord = source.label.slice(lastSpace + 1);
          return (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener"
                className="group inline-block min-h-11 py-3 text-sm leading-5 font-medium text-lilac-text"
              >
                {/* The last word, the arrow and the screen reader text never separate, so the arrow
                  never drifts from its label when the label wraps (same pattern as MetricChip). */}
                <span className="text-balance">
                  <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">
                    {lead}
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">
                      {lastWord}
                    </span>
                    <svg
                      className="ml-1 inline size-3.5 align-[-0.1em]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>{" "}
                    <span className="sr-only">(opens in a new tab)</span>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
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
        {ticket.details.length > 0 ? (
          <TicketExpander anchorId={ticket.slug} subject={ticket.title}>
            <DetailLines lines={ticket.details} />
            <Sources ticket={ticket} />
          </TicketExpander>
        ) : null}
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
          {ticket.details.length > 0 ? <DetailLines lines={ticket.details} /> : null}
          <Sources ticket={ticket} />
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
