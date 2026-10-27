// The small mono caps heading that opens each home section ("Where I've shipped", "How I work",
// "Selected work"). One style for all of them, so they always match. It is the
// section's h2. The footer pass's "What's next" and "Availability" are not section headings and
// keep the smaller label.
export function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="label-mono mb-2 text-sm text-text-secondary">
      {children}
    </h2>
  );
}
