// Inline route inside the hero sentence ("from idea ●···✈ to production"): a
// paper plane leaves the lilac idea dot, draws the dotted trail behind it and
// climbs away towards "production". An idea is a sheet of paper; folded into
// shape, it flies. CSS only (keyframes in globals.css): it plays once on load,
// lifts a little on hover, and with reduced motion it simply rests in flight.
// The full Route component (vertical/horizontal variants with scroll drawing)
// is built in the "Route signature component" task.
import { useId } from "react";

export function MiniRoute() {
  const maskId = useId();
  return (
    <svg
      viewBox="0 0 120 24"
      overflow="visible"
      className="mini-route mx-(--mini-route-gap) inline-block h-(--mini-route-height) w-(--mini-route-width) align-middle"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="24">
          <rect className="mini-route-reveal" x="0" y="0" width="120" height="24" fill="white" />
        </mask>
      </defs>
      <path
        d="M10 12 H64 Q76 12 84 10"
        fill="none"
        stroke="var(--color-route-line)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0.1 14"
        mask={`url(#${maskId})`}
      />
      <circle
        cx="10"
        cy="12"
        r="8"
        fill="var(--color-accent-lilac)"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
      />
      <g className="mini-route-plane">
        <g className="mini-route-plane-hover">
          {/* Top wing, keel (teal, the colour of "production") and the fold */}
          <path
            d="M16 0 L-16 -11 L-6 2 Z"
            fill="var(--color-plane-paper)"
            stroke="var(--color-border-strong)"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
          <path
            d="M16 0 L-6 2 L-12 10 Z"
            fill="var(--color-route-pin)"
            stroke="var(--color-border-strong)"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
