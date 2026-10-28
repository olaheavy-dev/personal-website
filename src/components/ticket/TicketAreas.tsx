// A work ticket's areas ("AI · Data & IoT") as one quiet, non interactive line beside "Read more".
// It is plain text: no link, no hover, not in the tab order. The visible words are hidden from
// assistive technology and replaced by a spoken phrase, "Areas: AI, Data & IoT", so the middle dot
// is never read out and the line does not sound like a list of controls.
export function TicketAreas({ areas, className }: { areas: readonly string[]; className?: string }) {
  if (areas.length === 0) return null;
  return (
    <p data-ticket-areas="" className={`label-mono text-text-tertiary ${className ?? ""}`.trim()}>
      <span className="sr-only">Areas: {areas.join(", ")}</span>
      <span aria-hidden="true">{areas.join(" · ")}</span>
    </p>
  );
}
