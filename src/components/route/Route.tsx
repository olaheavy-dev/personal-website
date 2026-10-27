// The route: the site's signature dotted line, with pins for stops. Server
// rendered and decorative. The visible stop names stay in real HTML owned by
// the consumer, so the route itself never carries text.
//
// How it fits together:
// - Route is the wrapper. It names the variant and the draw mode on the root;
//   all geometry is CSS (globals.css), so nothing is measured and nothing
//   shifts. A responsive variant ({ base, md }) is switched by a media query.
// - RoutePin (one per stop) draws its pin and the dotted leg to the NEXT stop.
//   Each stop's box must be position: relative, with the pin as its first item,
//   and the consumer sets --route-gap to the distance between two stops' boxes.
// - RouteObserver is the only client code: it starts the drawing (on view or
//   as pins are reached). Without JavaScript, or with reduced motion, the
//   finished route shows, because the base styles are the finished state.
import type { ReactNode } from "react";
import { RouteObserver } from "./RouteObserver";

export type RouteOrientation = "vertical" | "horizontal" | "inline";
export type RouteVariant = RouteOrientation | { base: RouteOrientation; md: RouteOrientation };
export type RouteDraw = "on-view" | "progressive" | "static";

export interface RouteProps {
  variant: RouteVariant;
  /** on-view: draws once when it enters the viewport. progressive: each pin as it is reached. static: always finished. */
  draw?: RouteDraw;
  /** Hook for filters: "hidden" hides every vehicle (CSS in globals.css). Default shown. */
  vehicles?: "shown" | "hidden";
  children: ReactNode;
  className?: string;
}

export function Route({ variant, draw = "on-view", vehicles = "shown", children, className }: RouteProps) {
  const base = typeof variant === "string" ? variant : variant.base;
  const md = typeof variant === "string" ? undefined : variant.md;
  const Tag = base === "inline" ? "span" : "div";
  return (
    <Tag
      data-route=""
      data-variant={base}
      data-md-variant={md}
      data-draw={draw}
      data-vehicles={vehicles}
      className={`route ${base === "inline" ? "inline-flex items-center gap-(--route-gap)" : "block"} ${className ?? ""}`.trim()}
    >
      {children}
      <RouteObserver draw={draw} />
    </Tag>
  );
}
