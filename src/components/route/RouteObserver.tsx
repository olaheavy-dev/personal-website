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

    // Parked vehicles (the Lagos danfo, the London bus): pins that share a data-route-park group
    // are visited by one vehicle, which shows at the most recently reached pin of its group
    // (data-latest, and data-door open on a vehicle that has a door). With reduced motion the
    // vehicles stay where the markup parks them (data-home), so nothing is marked at all.
    const slots = new Map<string, HTMLElement>();
    for (const slot of root.querySelectorAll<HTMLElement>("[data-parked-at]")) {
      slots.set(slot.dataset.parkedAt ?? "", slot);
    }
    const groups = new Map<string, HTMLElement[]>();
    for (const pin of pins) {
      const group = pin.dataset.routePark;
      if (group) groups.set(group, [...(groups.get(group) ?? []), pin]);
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const park = () => {
      if (reduced) return;
      for (const members of groups.values()) {
        const latest = members.findLast((pin) => pin.hasAttribute("data-reached"));
        for (const pin of members) {
          const slot = slots.get(pin.dataset.routePin ?? "");
          if (!slot) continue;
          const here = pin === latest;
          slot.toggleAttribute("data-latest", here);
          if (slot.hasAttribute("data-door")) slot.setAttribute("data-door", here ? "open" : "closed");
        }
      }
    };

    const finish = () => {
      root.setAttribute("data-drawn", "");
      for (const pin of pins) pin.setAttribute("data-reached", "");
      park();
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
        { rootMargin: "0px" },
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
      park();
      if (reachedCount >= pins.length) {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", checkEnd);
        pinObserver.disconnect();
        endObserver.disconnect();
      }
    };
    // The spec text on percentage root margins is read differently by engines (some
    // resolve the bottom edge against the width), so the 40% is turned into pixels of
    // the viewport height and the observer is rebuilt when the window resizes.
    const observePins = () =>
      new IntersectionObserver(
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
        { rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.4)}px 0px` },
      );
    let pinObserver = observePins();
    const onResize = () => {
      if (reachedCount >= pins.length) return;
      pinObserver.disconnect();
      pinObserver = observePins();
      for (const pin of pins.slice(reachedCount)) pinObserver.observe(pin);
    };
    window.addEventListener("resize", onResize);
    // The last pin can sit closer to the page end than 40% of the viewport (a tall
    // screen, a short footer), so it could never pass the line above. While it is on
    // screen at all, a scroll to the very end of the page (or a page that cannot scroll
    // further) counts every remaining pin as reached. Merely seeing the last pin is not
    // enough: that would skip the pins between, and a vehicle that visits them.
    const atPageEnd = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    const checkEnd = () => {
      if (atPageEnd()) reach(pins.length - 1);
    };
    let watchingEnd = false;
    const endObserver = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !watchingEnd) {
        watchingEnd = true;
        window.addEventListener("scroll", checkEnd, { passive: true });
        checkEnd();
      } else if (!visible && watchingEnd) {
        watchingEnd = false;
        window.removeEventListener("scroll", checkEnd);
      }
    });
    for (const pin of pins) pinObserver.observe(pin);
    const last = pins.at(-1);
    if (last) endObserver.observe(last);
    // Every pin already on screen at load counts as reached, so a short desktop shows the
    // first stops (and their vehicles) above the fold instead of waiting for a scroll.
    const onScreen = pins.reduce(
      (highest, pin, i) => (pin.getBoundingClientRect().top < window.innerHeight ? i : highest),
      -1,
    );
    if (onScreen >= 0) reach(onScreen);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", checkEnd);
      pinObserver.disconnect();
      endObserver.disconnect();
    };
  }, [draw]);

  return <span ref={anchor} hidden data-route-observer="" />;
}
