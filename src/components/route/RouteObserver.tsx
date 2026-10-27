"use client";

// The only client code of the route. It arms the route (data-armed, which is
// what makes the undrawn state apply), starts the drawing and parks the vehicles,
// nothing else. Layout is read only at load, in observer callbacks and in the page
// end check. The drawing never goes backwards; a parked vehicle follows the reader
// both ways. It marks the DOM (data-drawn on the route, data-reached on pins and
// data-latest on vehicles) and CSS does the animating. If this code never runs, the route is
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
    // are visited by one vehicle (data-latest, and data-door open on a vehicle that has a door).
    // It parks at the reader's place in its group: the last reached pin above the reading line
    // (40% up from the bottom of the viewport, the same line that reaches pins), so it drives
    // back up when the reader scrolls back up. Above all of them it waits at the first reached
    // one, and at the very end of the page at the last. With reduced motion the vehicles stay
    // where the markup parks them (data-home), so nothing is marked at all.
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
    // With reduced motion nothing parks, so nothing needs watching for it.
    const parkPins = reduced ? [] : pins.filter((pin) => pin.dataset.routePark);
    const atPageEnd = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    // The reading line, in pixels from the top of the viewport: 40% up from the bottom, rounded
    // the same way as the observers' root margin, so both agree on which side a pin is.
    const lineMargin = () => Math.round(window.innerHeight * 0.4);
    const park = () => {
      if (reduced) return;
      const line = window.innerHeight - lineMargin();
      const atEnd = atPageEnd();
      for (const members of groups.values()) {
        const reached = members.filter((pin) => pin.hasAttribute("data-reached"));
        const latest = atEnd
          ? reached.at(-1)
          : (reached.findLast((pin) => pin.getBoundingClientRect().top <= line) ?? reached[0]);
        for (const pin of members) {
          const slot = slots.get(pin.dataset.routePin ?? "");
          if (!slot) continue;
          const here = pin === latest;
          slot.toggleAttribute("data-latest", here);
          const door = here ? "open" : "closed";
          if (slot.hasAttribute("data-door") && slot.getAttribute("data-door") !== door) {
            slot.setAttribute("data-door", door);
          }
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
      // Once every pin is reached the drawing is done. A route with parked vehicles keeps its
      // parking observers (they follow the reader both ways); one without stops watching.
      if (reachedCount >= pins.length) {
        pinObserver.disconnect();
        if (parkPins.length === 0) {
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", checkEnd);
          endObserver.disconnect();
        }
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
        { rootMargin: `0px 0px -${lineMargin()}px 0px` },
      );
    let pinObserver = observePins();
    // Parking: any group pin crossing the reading line, either way, moves its vehicle.
    const observeParking = () =>
      new IntersectionObserver(() => park(), { rootMargin: `0px 0px -${lineMargin()}px 0px` });
    // Only a route with parked vehicles watches for parking (Home's route has none).
    let parkObserver = parkPins.length > 0 ? observeParking() : undefined;
    const onResize = () => {
      if (parkObserver) {
        parkObserver.disconnect();
        parkObserver = observeParking();
        for (const pin of parkPins) parkObserver.observe(pin);
      }
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
    // Also parks: reaching the page end, or leaving it, moves a vehicle to or from the last pin.
    const checkEnd = () => {
      if (!atPageEnd()) return park();
      if (reachedCount < pins.length) reach(pins.length - 1);
      else park();
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
    for (const pin of parkPins) parkObserver?.observe(pin);
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
      parkObserver?.disconnect();
      endObserver.disconnect();
    };
  }, [draw]);

  return <span ref={anchor} hidden data-route-observer="" />;
}
