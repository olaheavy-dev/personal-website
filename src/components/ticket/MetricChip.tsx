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
};

/** "(Optty, 2023)", "(Google Play)", or "(HBK)" when the figure already contains the year. */
export function attributionText(
  value: string,
  attribution?: string | null,
  year?: number | null,
): string | null {
  if (!attribution) return null;
  const showYear = year != null && !value.includes(String(year));
  return `(${showYear ? `${attribution}, ${year}` : attribution})`;
}

export function MetricChip({ value, label, source, attribution, year }: MetricChipProps) {
  const figure = `${value} ${label}`;
  const credit = attributionText(value, attribution, year);
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border-primary py-0.5 pr-0.5 pl-3 text-sm">
      <span>
        <span className="font-semibold whitespace-nowrap">{value}</span> {label}
        {credit ? (
          <>
            {" "}
            <span className="whitespace-nowrap text-text-secondary">{credit}</span>
          </>
        ) : null}
      </span>
      <SourceDisclosure figure={figure} source={source} />
    </div>
  );
}
