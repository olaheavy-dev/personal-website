import { SourceDisclosure, type MetricSource } from "./SourceDisclosure";

// A figure with its source. `source` is required by the type, so a number can
// not reach the page without one (decision 0005, the claims policy).

export type MetricChipProps = {
  /** The figure, for example "1M+". */
  value: string;
  /** What it counts, for example "Google Play downloads". */
  label: string;
  source: MetricSource;
};

export function MetricChip({ value, label, source }: MetricChipProps) {
  const figure = `${value} ${label}`;
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border-primary py-0.5 pr-0.5 pl-3 text-sm">
      <span>
        <span className="font-semibold">{value}</span> {label}
      </span>
      <SourceDisclosure figure={figure} source={source} />
    </div>
  );
}
