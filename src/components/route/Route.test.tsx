import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaneVehicle } from "./PaperPlane";
import { Route } from "./Route";
import { RoutePin } from "./RoutePin";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observers: FakeObserver[] = [];

class FakeObserver {
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: Callback) {
    observers.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el);
  }
  disconnect() {
    this.disconnected = true;
  }
}

async function fire(observer: FakeObserver, entries: Partial<IntersectionObserverEntry>[]) {
  await act(async () => observer.callback(entries));
}

function stops(draw: "on-view" | "progressive" | "static" = "on-view") {
  return (
    <Route variant={{ base: "vertical", md: "horizontal" }} draw={draw}>
      <ol>
        <li>
          <RoutePin id="a" tone="start" index={0} />
        </li>
        <li>
          <RoutePin id="b" index={1} vehicle={<PlaneVehicle />} />
        </li>
        <li>
          <RoutePin id="c" tone="end" index={2} />
        </li>
      </ol>
    </Route>
  );
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => vi.unstubAllGlobals());

describe("Route", () => {
  it("criterion 1: is decorative, has no text and nothing focusable", () => {
    const { container } = render(stops());
    const route = container.querySelector("[data-route]")!;
    expect(route.textContent).toBe("");
    expect(route.querySelectorAll("[data-route-pin]")).toHaveLength(3);
    for (const el of route.querySelectorAll("[data-route-pin], [data-route-leg], svg")) {
      expect(el.closest("[aria-hidden='true']")).not.toBeNull();
    }
    expect(route.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  });

  it("criterion 2: on-view draws once and disconnects", async () => {
    const { container } = render(stops());
    const route = container.querySelector("[data-route]")!;
    const io = observers[0]!;
    expect(route.hasAttribute("data-drawn")).toBe(false);
    await fire(io, [{ isIntersecting: false }]);
    expect(route.hasAttribute("data-drawn")).toBe(false);
    await fire(io, [{ isIntersecting: true }]);
    expect(route.hasAttribute("data-drawn")).toBe(true);
    expect(io.disconnected).toBe(true);
  });

  it("criterion 3: progressive reaches pins in order and never undraws", async () => {
    const { container } = render(stops("progressive"));
    const pins = Array.from(container.querySelectorAll<HTMLElement>("[data-route-pin]"));
    const io = observers[0]!;
    expect(io.observed).toHaveLength(3);
    const entry = (i: number, isIntersecting: boolean, top = 9999) => ({
      target: pins[i],
      isIntersecting,
      boundingClientRect: { top } as DOMRectReadOnly,
      rootBounds: { bottom: 500 } as DOMRectReadOnly,
    });
    await fire(io, [entry(0, true), entry(1, false)]);
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, false, false]);
    // Scrolling back up reports pin 0 as not intersecting: it stays reached.
    await fire(io, [entry(0, false)]);
    expect(pins[0]!.hasAttribute("data-reached")).toBe(true);
    // Jumping past pin 1 straight to pin 2 reaches 1 as well, in order.
    await fire(io, [entry(2, true)]);
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, true, true]);
    expect(io.disconnected).toBe(true);
  });

  it("criterion 4: draws at once without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(stops());
    expect(container.querySelector("[data-route]")!.hasAttribute("data-drawn")).toBe(true);
    for (const pin of container.querySelectorAll("[data-route-pin]")) {
      expect(pin.hasAttribute("data-reached")).toBe(true);
    }
  });

  it("static draws nothing and observes nothing", () => {
    render(stops("static"));
    expect(observers).toHaveLength(0);
  });

  it("criterion 6: a pin's vehicle rides its leg; an end pin has no leg", () => {
    const { container } = render(stops());
    const legs = container.querySelectorAll("[data-route-leg]");
    expect(legs).toHaveLength(2);
    expect(legs[0]!.querySelector(".route-plane")).toBeNull();
    expect(legs[1]!.querySelector(".route-vehicle .route-seat .route-plane")).not.toBeNull();
    const endPin = container.querySelector("[data-route-pin='c']")!;
    expect(endPin.nextElementSibling).toBeNull();
  });

  it("criterion 6: warns in development when two pins share an id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Route variant="horizontal">
        <RoutePin id="x" />
        <RoutePin id="x" tone="end" />
      </Route>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"x"'));
    warn.mockRestore();
  });

  it("criterion 7: unmount disconnects observers", () => {
    const { unmount } = render(stops());
    const rendered = observers.slice();
    unmount();
    expect(rendered.every((o) => o.disconnected)).toBe(true);
    const progressive = render(stops("progressive"));
    const io = observers.at(-1)!;
    progressive.unmount();
    expect(io.disconnected).toBe(true);
  });

  it("names the variants on the root for CSS", () => {
    const { container } = render(stops());
    const route = container.querySelector("[data-route]")!;
    expect(route.getAttribute("data-variant")).toBe("vertical");
    expect(route.getAttribute("data-md-variant")).toBe("horizontal");
    expect(route.getAttribute("data-draw")).toBe("on-view");
  });
});
