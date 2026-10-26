import { InProgressTag } from "@/components/lab/InProgressTag";
import { MetricChip } from "@/components/ticket/MetricChip";
import { Ticket } from "@/components/ticket/Ticket";
import type { LabMiniCardModel } from "@/lib/home/two-up";

// A Lab project on Home: name, one approved line, evidence links and, where the claims policy
// allows one, a single sourced figure. Text only (owner decision, 25 Oct 2026). Server component.
export function LabMiniCard({ card }: { card: LabMiniCardModel }) {
  // A sourced figure, else the In progress tag; a card with neither has no stub. One row height
  // for every stub, so the perforations line up across the three cards.
  const stubContent = card.outcome ? (
    <MetricChip
      value={card.outcome.figure}
      label={card.outcome.description}
      source={card.outcome.source}
      attribution={null}
    />
  ) : card.inProgress ? (
    <InProgressTag />
  ) : null;
  const stub = stubContent ? <div className="flex min-h-11 items-center">{stubContent}</div> : undefined;

  return (
    <Ticket
      title={card.name}
      headingLevel={3}
      size="compact"
      className="w-full"
      bodyPadding="flex flex-1 flex-col px-5 pt-5 pb-5"
      data-lab-card={card.slug}
      stub={stub}
    >
      {card.summary ? (
        <p data-summary="" className="mt-2 text-sm leading-relaxed text-text-secondary">
          {card.summary}
        </p>
      ) : null}
      {card.links.length > 0 ? (
        <ul role="list" aria-label={`${card.name} links`} className="mt-3 flex flex-wrap gap-x-5">
          {card.links.map((link) => (
            <li key={link.kind}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener"
                className="group inline-flex min-h-11 items-center gap-1 text-sm font-medium text-lilac-text"
              >
                <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">
                  {link.label}
                </span>
                <svg
                  className="size-3.5"
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
                <span className="sr-only">({card.name}, opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Ticket>
  );
}
