// One stop on a Route: a decorative pin and, unless it is the end of the line,
// the dotted leg to the next stop with an optional vehicle that rides it. The
// stop's name lives in the consumer's HTML; the pin id equals the stop slug so
// it can later point at `/work#<slug>`.
import type { ReactNode } from "react";
import { RouteLeg } from "./RouteLeg";

export type PinTone = "start" | "default" | "current" | "end";

export const pinToneClass: Record<PinTone, string> = {
  start: "bg-lilac",
  default: "bg-bg-primary",
  current: "bg-route-active",
  end: "bg-route-pin",
};

export interface RoutePinProps {
  id: string;
  tone?: PinTone;
  /** Position in the route, from 0: staggers the drawing so legs draw in order. */
  index?: number;
  /**
   * Rides the leg to the next stop and rests just before it. Not on an end pin.
   * Note for the danfo and handover (#66): a vehicle that passes through a pin
   * and carries on needs an additive "passes through" mode, since today a vehicle
   * stays on the single leg that follows its pin.
   */
  vehicle?: ReactNode;
  /** The last stop has no leg after it. Implied by tone "end"; use it for a last stop that is also the current one. */
  last?: boolean;
}

export function RoutePin({ id, tone = "default", index = 0, vehicle, last = false }: RoutePinProps) {
  const style = { "--route-i": index } as React.CSSProperties;
  return (
    <>
      <span
        aria-hidden="true"
        data-route-pin={id}
        data-tone={tone}
        style={style}
        className={`route-pin relative z-10 size-(--route-pin-size) shrink-0 rounded-full border-2 border-border-strong ${pinToneClass[tone]}`}
      />
      {tone !== "end" && !last && <RouteLeg style={style}>{vehicle}</RouteLeg>}
    </>
  );
}
