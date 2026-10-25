"use client";

// The only client code of the route. It starts the drawing and nothing else:
// no scroll listeners, no layout reads outside observer callbacks, and the
// drawing never goes backwards. It marks the DOM (data-drawn on the route,
// data-reached on pins) and CSS does the animating.
import { useEffect, useRef } from "react";
import type { RouteDraw } from "./Route";

export function RouteObserver({ draw }: { draw: RouteDraw }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-route]");
    if (!root || draw === "static") return;

    const pins = Array.from(root.querySelectorAll<HTMLElement>("[data-route-pin]"));
    if (process.env.NODE_ENV !== "production") {
      const ids = pins.map((pin) => pin.dataset.routePin);
      const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
      if (duplicate) console.warn(`Route: more than one pin has the id "${duplicate}".`);
    }

    const finish = () => {
      root.setAttribute("data-drawn", "");
      for (const pin of pins) pin.setAttribute("data-reached", "");
      root.style.setProperty("--route-progress", "1");
    };

    // No IntersectionObserver: show the finished route at once.
    if (typeof IntersectionObserver === "undefined") {
      finish();
      return;
    }

    if (draw === "on-view") {
      let cancelled = false;
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          io.disconnect();
          // Start once the page's own entrance animations (the hero plane) have
          // landed, so two things never fly at once. Already landed: start now.
          const entrance = (document.getAnimations?.() ?? [])
            .filter(
              (a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState !== "finished",
            )
            .map((a) => a.finished.catch(() => null));
          void Promise.all(entrance).then(() => {
            if (!cancelled) finish();
          });
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(root);
      return () => {
        io.disconnect();
        cancelled = true;
      };
    }

    // progressive: a pin counts as reached once it is above the lower 40% of the
    // viewport; every pin before it is reached too, so the order is kept.
    let reachedCount = 0;
    const io = new IntersectionObserver(
      (entries) => {
        let highest = reachedCount - 1;
        for (const entry of entries) {
          const bottom = entry.rootBounds?.bottom ?? window.innerHeight;
          if (entry.isIntersecting || entry.boundingClientRect.top < bottom) {
            highest = Math.max(highest, pins.indexOf(entry.target as HTMLElement));
          }
        }
        if (highest < reachedCount) return;
        for (let i = reachedCount; i <= highest; i++) {
          const pin = pins[i];
          if (!pin) continue;
          pin.setAttribute("data-reached", "");
          io.unobserve(pin);
        }
        reachedCount = highest + 1;
        root.style.setProperty("--route-progress", String(reachedCount / pins.length));
        if (reachedCount === pins.length) io.disconnect();
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    for (const pin of pins) io.observe(pin);
    return () => io.disconnect();
  }, [draw]);

  return <span ref={anchor} hidden data-route-observer="" />;
}
