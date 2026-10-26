// A figure with its source. `source` is required by the type, so a number can
// not reach the page without one (decision 0005, the claims policy). A link source
// makes the figure itself the link; the credit shows no year, because the linked
// source carries the date (owner decision, 26 Oct 2026).

// Where a figure comes from: a public link, or the author's own measurement
// (decision 0005 allows both; nothing else).
export type MetricSource =
  | {
      kind: "link";
      /** Who published it, for example "Google Play listing". */
      label: string;
      url: string;
    }
  | {
      kind: "own";
      /** How it was measured, for example "Lighthouse, mobile, 12 May 2026". */
      note: string;
    };

export type MetricChipProps = {
  /** The figure, for example "1M+". It never splits across lines. */
  value: string;
  /** What it counts, for example "Google Play downloads". */
  label: string;
  source: MetricSource;
  /** Who made a company's claim, for example "Optty". Shown beside the figure. */
  attribution?: string | null;
};

/** "(Optty)", or null when nobody is credited. */
export function attributionText(attribution?: string | null): string | null {
  return attribution ? `(${attribution})` : null;
}

export function MetricChip({ value, label, source, attribution }: MetricChipProps) {
  // An own measurement says so; a company claim names who made it.
  const credit = source.kind === "own" ? "(own measurement)" : attributionText(attribution);
  // One sentence of text, left aligned: the figure, what it counts, then the credit. The last
  // word, the arrow and the credit never separate, so the credit never wraps alone.
  const lastSpace = label.lastIndexOf(" ");
  const lead = lastSpace === -1 ? "" : label.slice(0, lastSpace + 1);
  const lastWord = label.slice(lastSpace + 1);
  // text-balance evens the two lines a long figure wraps to, so no word sits alone.
  // inline-block stops the link's underline reaching the credit.
  const creditEl = (gap: string) =>
    credit ? (
      <span className={`${gap} inline-block whitespace-nowrap text-text-secondary`}>{credit}</span>
    ) : null;
  // Only the words are underlined, not the arrow, the space or the credit after them.
  const underline = "underline decoration-1 underline-offset-4 group-hover:no-underline";
  const figure = <span className="font-semibold whitespace-nowrap text-text-primary">{value}</span>;

  if (source.kind === "own") {
    return (
      <p className="flex min-h-11 w-fit max-w-full items-center text-sm">
        <span className="text-balance">
          {figure} {lead}
          <span className="whitespace-nowrap">
            {lastWord}
            {creditEl("ml-1")}
          </span>
        </span>
      </p>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener"
      className="group flex min-h-11 w-fit max-w-full items-center text-sm text-lilac-text"
    >
      <span className="text-balance">
        <span className={underline}>
          {figure} {lead}
        </span>
        <span className="whitespace-nowrap">
          <span className={underline}>{lastWord}</span>
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
          {creditEl("")} {/* After the credit, so the visible text comes first in the name (WCAG 2.5.3). */}
          <span className="sr-only">(source: {source.label}, opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}
