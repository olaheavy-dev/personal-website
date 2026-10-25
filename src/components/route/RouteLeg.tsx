// The dotted line between two stops. Both orientations are rendered and CSS
// shows the one the route's variant calls for. Each line is drawn through a
// mask whose stroke is normalised (pathLength 1) and animates its dashoffset,
// so the dots appear in order without measuring anything.
import { useId, type CSSProperties, type ReactNode } from "react";

function Line({ axis }: { axis: "v" | "h" }) {
  const maskId = useId();
  const [x1, y1, x2, y2] = axis === "v" ? ["50%", "0", "50%", "100%"] : ["0", "50%", "100%", "50%"];
  return (
    <svg className={`route-line route-line-${axis}`} overflow="visible" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-1000%" y="-1000%" width="2100%" height="2100%">
          <line className="route-mask-line" x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" />
        </mask>
      </defs>
      <line className="route-dots" x1={x1} y1={y1} x2={x2} y2={y2} mask={`url(#${maskId})`} />
    </svg>
  );
}

export function RouteLeg({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return (
    <span aria-hidden="true" data-route-leg="" style={style} className="route-leg">
      <Line axis="v" />
      <Line axis="h" />
      {children != null && (
        <span className="route-vehicle">
          <span className="route-seat">{children}</span>
        </span>
      )}
    </span>
  );
}
