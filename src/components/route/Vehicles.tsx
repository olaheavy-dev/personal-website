// The Work route's land vehicles: a Lagos danfo and a red London double decker, drawn flat in
// the site's ink outline style (the same look as the paper plane). Decorative, so everything
// here is aria-hidden.
//
// - VehicleSprites is rendered once per page. It holds each drawing as an SVG <symbol>, so the
//   page carries one copy of the art and every placed vehicle is a short <use> reference.
// - ParkedVehicle is one placed vehicle. It sits in the rail beside a stop (RouteObserver finds
//   it by data-parked-at) and CSS shows the phone pin (a 32 px disc) or the side view.
// - Outlines use --color-border-strong, like the plane, so the shape stays visible on the dark
//   page; stripes, wheels and bumpers stay ink in both themes (--ink-900). Windows are the teal
//   accent. Colours are tokens only (src/styles/tokens.css); there is no lettering or logo.
// - The danfo's sliding door is its own drawing, laid over the body, so CSS can slide it back
//   (data-door="open") to show the dark inside.

export type ParkedKind = "danfo" | "bus";

const outline = "var(--color-border-strong)";
const ink = "var(--ink-900)";
const glass = "var(--color-accent-teal)";
const paper = "var(--color-plane-paper)";

export const vehicleViewBox: Record<ParkedKind, string> = {
  danfo: "0 0 120 62",
  bus: "0 0 120 78",
};

export function VehicleSprites() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      className="absolute size-0 overflow-hidden"
      data-vehicle-sprites=""
    >
      <defs>
        {/* Danfo, side view, facing right. */}
        <symbol id="vehicle-danfo" viewBox={vehicleViewBox.danfo} overflow="visible">
          <rect x="1" y="44" width="7" height="6" rx="1" fill={ink} />
          <rect x="112" y="44" width="7" height="6" rx="1" fill={ink} />
          <rect x="4" y="6" width="112" height="42" rx="8" fill="var(--color-danfo)" />
          <path d="M4 36 H116 V40 a8 8 0 0 1 -8 8 H12 a8 8 0 0 1 -8 -8 Z" fill="var(--color-danfo-band)" />
          <rect x="44" y="10" width="36" height="34" rx="2" fill={ink} />
          <rect x="10" y="12" width="28" height="16" rx="3" fill={glass} stroke={ink} strokeWidth="1.5" />
          <rect x="86" y="12" width="22" height="16" rx="3" fill={glass} stroke={ink} strokeWidth="1.5" />
          <path d="M4 32.5 H116 M4 36 H116" stroke={ink} strokeWidth="1.5" />
          <circle cx="112" cy="38" r="3.5" fill={paper} stroke={ink} strokeWidth="1.5" />
          <rect x="4" y="6" width="112" height="42" rx="8" fill="none" stroke={outline} strokeWidth="2.5" />
          <circle cx="28" cy="50" r="9" fill={ink} stroke={outline} strokeWidth="2" />
          <circle cx="28" cy="50" r="3.5" fill={paper} />
          <circle cx="92" cy="50" r="9" fill={ink} stroke={outline} strokeWidth="2" />
          <circle cx="92" cy="50" r="3.5" fill={paper} />
        </symbol>
        {/* The sliding door: a body coloured panel with its own window, drawn closed. */}
        <g id="vehicle-danfo-door">
          <rect
            x="44"
            y="10"
            width="36"
            height="34"
            rx="2"
            fill="var(--color-danfo)"
            stroke={ink}
            strokeWidth="1.5"
          />
          <rect x="49" y="14" width="26" height="14" rx="3" fill={glass} stroke={ink} strokeWidth="1.5" />
          <path d="M44 32.5 H80 M44 36 H80" stroke={ink} strokeWidth="1.5" />
        </g>
        {/* London double decker, side view, facing right, open rear platform. */}
        <symbol id="vehicle-bus" viewBox={vehicleViewBox.bus} overflow="visible">
          <path
            d="M4 14 a10 10 0 0 1 10 -10 H98 a16 16 0 0 1 16 16 V60 a6 6 0 0 1 -6 6 H10 a6 6 0 0 1 -6 -6 Z"
            fill="var(--color-bus)"
          />
          <rect x="4" y="30" width="110" height="6" fill={paper} />
          <rect x="4" y="38" width="18" height="24" fill={ink} />
          {[12, 31, 50, 69, 88].map((x) => (
            <rect
              key={x}
              x={x}
              y="10"
              width="15"
              height="16"
              rx="2.5"
              fill={glass}
              stroke={ink}
              strokeWidth="1.5"
            />
          ))}
          {[28, 52, 76].map((x) => (
            <rect
              key={x}
              x={x}
              y="40"
              width="20"
              height="16"
              rx="2.5"
              fill={glass}
              stroke={ink}
              strokeWidth="1.5"
            />
          ))}
          <rect x="99" y="40" width="11" height="16" rx="2.5" fill={glass} stroke={ink} strokeWidth="1.5" />
          <path d="M12 36 V66" stroke={paper} strokeWidth="2" strokeLinecap="round" />
          <circle cx="110" cy="60" r="3.5" fill={paper} stroke={ink} strokeWidth="1.5" />
          <path d="M4 60 H114 V60 a6 6 0 0 1 -6 6 H10 a6 6 0 0 1 -6 -6 Z" fill={ink} />
          <path
            d="M4 14 a10 10 0 0 1 10 -10 H98 a16 16 0 0 1 16 16 V60 a6 6 0 0 1 -6 6 H10 a6 6 0 0 1 -6 -6 Z"
            fill="none"
            stroke={outline}
            strokeWidth="2.5"
          />
          <circle cx="28" cy="66" r="9" fill={ink} stroke={outline} strokeWidth="2" />
          <circle cx="28" cy="66" r="3.5" fill={paper} />
          <circle cx="92" cy="66" r="9" fill={ink} stroke={outline} strokeWidth="2" />
          <circle cx="92" cy="66" r="3.5" fill={paper} />
        </symbol>
        {/* Phone pins, 32 px discs: a tiny van front on yellow, two window rows on red. */}
        <symbol id="vehicle-danfo-pin" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="15" fill="var(--color-danfo)" stroke={outline} strokeWidth="2" />
          <rect
            x="8"
            y="7.5"
            width="16"
            height="17"
            rx="3"
            fill="var(--color-danfo-band)"
            stroke={ink}
            strokeWidth="1.5"
          />
          <rect x="10.5" y="10" width="11" height="6" rx="1.5" fill={glass} stroke={ink} strokeWidth="1" />
          <rect x="10.5" y="18" width="11" height="3" fill={ink} />
          <circle cx="12.5" cy="19.5" r="1.1" fill={paper} />
          <circle cx="19.5" cy="19.5" r="1.1" fill={paper} />
        </symbol>
        <symbol id="vehicle-bus-pin" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="15" fill="var(--color-bus)" stroke={outline} strokeWidth="2" />
          {[8, 14, 20].map((x) => (
            <rect key={`u${x}`} x={x - 1} y="8.5" width="5" height="5" rx="1" fill={paper} />
          ))}
          {[8, 14, 20].map((x) => (
            <rect key={`l${x}`} x={x - 1} y="16.5" width="5" height="5" rx="1" fill={paper} />
          ))}
          <rect x="7" y="14.5" width="18" height="1.5" fill={ink} />
          <rect x="7" y="23" width="18" height="2" rx="1" fill={ink} />
        </symbol>
      </defs>
    </svg>
  );
}

export interface ParkedVehicleProps {
  kind: ParkedKind;
  /** The id of the RoutePin this vehicle waits beside. RouteObserver matches on it. */
  at: string;
  /** Where it rests with reduced motion or without JavaScript. */
  home?: boolean;
}

export function ParkedVehicle({ kind, at, home = false }: ParkedVehicleProps) {
  const door = kind === "danfo" ? (home ? "open" : "closed") : undefined;
  return (
    <span
      aria-hidden="true"
      className="route-parked"
      data-vehicle={kind}
      data-parked-at={at}
      data-home={home ? "" : undefined}
      data-door={door}
      data-direction="right"
    >
      <svg viewBox={vehicleViewBox[kind]} className="vehicle-side" data-view="side" overflow="visible">
        <use href={`#vehicle-${kind}`} />
        {kind === "danfo" && <use href="#vehicle-danfo-door" className="vehicle-door" />}
      </svg>
      <svg viewBox="0 0 32 32" className="vehicle-pin" data-view="pin">
        <use href={`#vehicle-${kind}-pin`} />
      </svg>
    </span>
  );
}
