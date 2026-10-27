// The small mono caps heading that opens each home section ("Where I've shipped", "How I work",
// "Selected work"). One style for all of them, so they always match. It is the
// section's h2. The footer pass's "What's next" and "Availability" are not section headings and
// keep the smaller label.
// `className` replaces the default bottom margin where a section lays the label out differently
// (the Toolkit on /work puts it in a grid column).
export function SectionLabel({
  id,
  children,
  className = "mb-2",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={`label-mono text-sm text-text-secondary ${className}`}>
      {children}
    </h2>
  );
}
