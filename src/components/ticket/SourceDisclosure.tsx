import { useId } from "react";

// Where a figure comes from, in a native popover (no client JavaScript): light
// dismiss, Esc and focus return are handled by the browser. Styles in globals.css
// (".source-popover"): a bottom sheet on phones, beside the button where CSS anchor
// positioning is supported.

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-25" as "25 Oct 2026". Read from the text, so no time zone can move the day. */
export function formatCheckedOn(isoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const month = match ? months[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} ${month} ${match[1]}` : null;
}

export function SourceDisclosure({
  figure,
  source,
  checkedOn,
}: {
  figure: string;
  source: MetricSource;
  /** The day a link source was last opened, as YYYY-MM-DD. */
  checkedOn?: string | null;
}) {
  const checked = checkedOn ? formatCheckedOn(checkedOn) : null;
  const id = useId();
  // Anchor names are dashed idents; React's ids contain characters CSS rejects.
  const anchor = `--source-${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className="source-trigger -my-1 size-11 shrink-0 rounded-full text-text-secondary hover:text-text-primary"
        style={{ "--source-anchor": anchor } as React.CSSProperties}
        aria-label={`Source for ${figure}`}
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      </button>
      <div
        id={id}
        popover="auto"
        className="source-popover"
        style={{ "--source-anchor": anchor } as React.CSSProperties}
      >
        <p className="label-mono text-text-tertiary">Source</p>
        <p className="source-figure mt-2 text-sm text-text-secondary">{figure}</p>
        {source.kind === "link" ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex min-h-11 items-center gap-1 text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
          >
            {source.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <p className="mt-3 text-sm">
            <span className="font-medium">Own measurement.</span> {source.note}
          </p>
        )}
        {source.kind === "link" && checked ? (
          <p className="mt-1 text-sm text-text-secondary">Checked {checked}</p>
        ) : null}
        <button
          type="button"
          popoverTarget={id}
          popoverTargetAction="hide"
          className="source-close mt-2 min-h-11 text-sm font-medium text-text-secondary underline decoration-1 underline-offset-4 hover:text-text-primary hover:no-underline"
        >
          Close
        </button>
      </div>
    </>
  );
}
