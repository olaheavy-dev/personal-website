// The paper plane drawing, shared by the hero MiniRoute and the Route vehicle
// slot. Returns SVG shapes (not an <svg>), centred on the origin and pointing
// right, so each caller places and rotates it in its own coordinate space.
export function PaperPlane({ className }: { className?: string }) {
  return (
    <g className={className}>
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
  );
}

// The plane as a stand alone vehicle: its own small SVG, decorative.
export function PlaneVehicle() {
  return (
    <svg
      viewBox="-18 -14 36 28"
      overflow="visible"
      className="route-plane block h-(--route-plane-size) w-auto"
      aria-hidden="true"
    >
      <PaperPlane />
    </svg>
  );
}
