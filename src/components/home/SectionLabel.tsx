// The small mono caps heading that opens each home section ("Where I've shipped", "The route,
// every time", "Selected stops"). One style for all of them, so they always match. It is the
// section's h2. The footer pass's "Next stop" and "Availability" are not section headings and
// keep the smaller label.
export function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="label-mono mb-2 text-sm text-text-secondary">
      {children}
    </h2>
  );
}
