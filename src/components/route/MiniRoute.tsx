// Inline dotted route used inside the hero sentence ("from idea ●···● to
// production"). The full Route component (vertical/horizontal variants with
// scroll drawing) is built in the "Route signature component" task.
export function MiniRoute() {
  return (
    <svg
      viewBox="0 0 120 24"
      className="mx-[0.12em] inline-block h-[0.5em] w-[2.4em] align-middle"
      aria-hidden="true"
    >
      <line
        x1="10"
        y1="12"
        x2="110"
        y2="12"
        stroke="var(--color-route-line)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0.1 14"
      />
      <circle
        cx="10"
        cy="12"
        r="8"
        fill="var(--color-accent-lilac)"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
      />
      <circle
        cx="110"
        cy="12"
        r="8"
        fill="var(--color-route-pin)"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
      />
    </svg>
  );
}
