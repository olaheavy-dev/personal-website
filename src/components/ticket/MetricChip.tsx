import { SourceDisclosure, type MetricSource } from "./SourceDisclosure";

// A figure with its source. `source` is required by the type, so a number can
// not reach the page without one (decision 0005, the claims policy).

export type MetricChipProps = {
  /** The figure, for example "1M+". It never splits across lines. */
  value: string;
  /** What it counts, for example "Google Play downloads". */
  label: string;
  source: MetricSource;
  /** Who made a company's claim, for example "Optty". Shown beside the figure, not only in the popover. */
  attribution?: string | null;
  /** The year the claim was true. Left out when the figure already holds it, as "2025 R4" does. */
  year?: number | null;
  /** The day the source was last opened (YYYY-MM-DD), shown in the source popover. */
  checkedOn?: string | null;
};

/** "(Optty, 2023)", "(Google Play)", or "(HBK)" when the figure already contains the year. */
export function attributionText(
  value: string,
  attribution?: string | null,
  year?: number | null,
): string | null {
  if (!attribution) return null;
  const showYear = year != null && !new RegExp(`\\b${year}\\b`).test(value);
  return `(${showYear ? `${attribution}, ${year}` : attribution})`;
}

export function MetricChip({ value, label, source, attribution, year, checkedOn }: MetricChipProps) {
  const figure = `${value} ${label}`;
  const credit = attributionText(value, attribution, year);
  // The credit stays on the same line as the label's last word, so it never wraps alone.
  const lastSpace = label.lastIndexOf(" ");
  const lead = lastSpace === -1 ? "" : label.slice(0, lastSpace + 1);
  const lastWord = label.slice(lastSpace + 1);
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border-strong py-0.5 pr-0.5 pl-3 text-sm">
      <span>
        <span className="font-semibold whitespace-nowrap">{value}</span> {lead}
        {credit ? (
          <span className="whitespace-nowrap">
            {lastWord} <span className="text-text-secondary">{credit}</span>
          </span>
        ) : (
          lastWord
        )}
      </span>
      <SourceDisclosure figure={figure} source={source} checkedOn={checkedOn} />
    </div>
  );
}
