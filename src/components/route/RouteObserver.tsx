"use client";

// The only client code of the route. It arms the route (data-armed, which is
// what makes the undrawn state apply) and starts the drawing, nothing else: no
// scroll listeners, no layout reads outside observer callbacks, and the drawing
// never goes backwards. It marks the DOM (data-drawn on the route, data-reached
// on pins) and CSS does the animating. If this code never runs, the route is
// simply shown finished.
import { useEffect, useRef } from "react";
import type { RouteDraw } from "./Route";

// The hero's entrance animations (src/app/globals.css). A route that draws on
// view waits for these so two things never fly at once, but never for longer
// than they could take.
const ENTRANCE = new Set(["mini-route-flight", "name-sweep", "name-ink"]);

const msOf = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? (value.trim().endsWith("ms") ? n : n * 1000) : 0;
};

function entranceAnimations() {
  return (document.getAnimations?.() ?? []).filter(
    (a) => ENTRANCE.has((a as CSSAnimation).animationName) && a.playState !== "finished",
  );
}

// How long the hero entrance can take, from its own tokens, plus a margin.
function entranceTimeout() {
  const style = getComputedStyle(document.documentElement);
  const total =
    msOf(style.getPropertyValue("--hero-takeoff")) + msOf(style.getPropertyValue("--duration-flight"));
  return (total || 2000) + 500;
}

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
    };

    // No IntersectionObserver: show the finished route at once.
    if (typeof IntersectionObserver === "undefined") {
      finish();
      return;
    }
    root.setAttribute("data-armed", "");

    if (draw === "on-view") {
      let cancelled = false;
      let timer: number | undefined;
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          io.disconnect();
          // Wait for the hero entrance to land (already landed: start now), but
          // never longer than it could take.
          const waiting = entranceAnimations().map((a) => a.finished.catch(() => null));
          const go = () => {
            window.clearTimeout(timer);
            if (!cancelled) finish();
          };
          if (waiting.length === 0) return go();
          timer = window.setTimeout(go, entranceTimeout());
          void Promise.all(waiting).then(go);
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(root);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        io.disconnect();
      };
    }

    // progressive: a pin counts as reached once it is above the lower 40% of the
    // viewport; every pin before it is reached too, so the order is kept.
    let reachedCount = 0;
    const reach = (upTo: number) => {
      for (let i = reachedCount; i <= upTo; i++) {
        const pin = pins[i];
        if (!pin) continue;
        pin.setAttribute("data-reached", "");
        pinObserver.unobserve(pin);
      }
      reachedCount = Math.max(reachedCount, upTo + 1);
      if (reachedCount >= pins.length) {
        pinObserver.disconnect();
        endObserver.disconnect();
      }
    };
    const pinObserver = new IntersectionObserver(
      (entries) => {
        let highest = -1;
        for (const entry of entries) {
          const bottom = entry.rootBounds?.bottom ?? window.innerHeight;
          if (entry.isIntersecting || entry.boundingClientRect.top < bottom) {
            highest = Math.max(highest, pins.indexOf(entry.target as HTMLElement));
          }
        }
        if (highest >= reachedCount) reach(highest);
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    // The last pin can sit closer to the page end than 40% of the viewport (a tall
    // screen, a short footer), so it could never pass the line above. Once it is
    // visible at all, every remaining pin counts as reached.
    const endObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) reach(pins.length - 1);
    });
    for (const pin of pins) pinObserver.observe(pin);
    const last = pins.at(-1);
    if (last) endObserver.observe(last);
    return () => {
      pinObserver.disconnect();
      endObserver.disconnect();
    };
  }, [draw]);

  return <span ref={anchor} hidden data-route-observer="" />;
}
