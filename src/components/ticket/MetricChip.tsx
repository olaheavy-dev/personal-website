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

const chipClass = "inline-flex items-center gap-x-1.5 rounded-lg border border-border-strong text-sm";

export function MetricChip({ value, label, source, attribution }: MetricChipProps) {
  // An own measurement says so; a company claim names who made it.
  const credit = source.kind === "own" ? "(own measurement)" : attributionText(attribution);
  // The last word of the label and the arrow never separate.
  const lastSpace = label.lastIndexOf(" ");
  const lead = lastSpace === -1 ? "" : label.slice(0, lastSpace + 1);
  const lastWord = label.slice(lastSpace + 1);
  const creditEl = credit ? (
    <span className="shrink-0 whitespace-nowrap text-text-secondary">{credit}</span>
  ) : null;

  if (source.kind === "own") {
    return (
      <div className={`${chipClass} min-h-11 px-3 py-1`}>
        <span>
          <span className="font-semibold whitespace-nowrap">{value}</span> {label}
        </span>
        {creditEl}
      </div>
    );
  }

  return (
    <div className={`${chipClass} pr-3`}>
      <a
        href={source.url}
        target="_blank"
        rel="noopener"
        className="flex min-h-11 items-center py-1 pl-3 underline decoration-1 underline-offset-4 hover:no-underline"
      >
        <span>
          <span className="font-semibold whitespace-nowrap">{value}</span> {lead}
          <span className="whitespace-nowrap">
            {lastWord}
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
            <span className="sr-only">(source: {source.label}, opens in a new tab)</span>
          </span>
        </span>
      </a>
      {creditEl}
    </div>
  );
}
