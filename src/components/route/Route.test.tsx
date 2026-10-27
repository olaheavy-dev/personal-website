import { act, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
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

// jsdom lays nothing out: put every pin below the fold and make the page tall, so a route is not
// reached at load and the end of the page is not "scrolled to". Tests change `page` to move.
const page = { scrollY: 0, innerHeight: 768, scrollHeight: 5000 };
function stubLayout() {
  page.scrollY = 0;
  page.scrollHeight = 5000;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => page.scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: () => page.scrollHeight,
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 9999 } as DOMRect);
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  stubLayout();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

  it("criterion 4b: the route is armed once the observer mounts, and not before", () => {
    const html = renderToStaticMarkup(stops());
    // Server markup (and so a page whose script never loads) is the finished route.
    expect(html).not.toContain("data-armed");
    expect(html).not.toContain("data-drawn");
    const { container } = render(stops());
    expect(container.querySelector("[data-route]")!.hasAttribute("data-armed")).toBe(true);
    const staticRoute = render(stops("static"));
    expect(staticRoute.container.querySelector("[data-route]")!.hasAttribute("data-armed")).toBe(false);
  });

  it("progressive: a last pin nearer the page end than 40% of the viewport completes the route at the page end", async () => {
    const { container } = render(stops("progressive"));
    const pins = Array.from(container.querySelectorAll<HTMLElement>("[data-route-pin]"));
    const [pinObserver, endObserver] = observers as [FakeObserver, FakeObserver];
    expect(endObserver.observed).toEqual([pins[2]]);
    // Only the first pin passes the 40% line on a tall screen.
    await fire(pinObserver, [
      {
        target: pins[0],
        isIntersecting: true,
        boundingClientRect: { top: 100 } as DOMRectReadOnly,
        rootBounds: { bottom: 1920 } as DOMRectReadOnly,
      },
    ]);
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, false, false]);
    // The last pin is visible but the page can still scroll: the pins between are not skipped.
    await fire(endObserver, [{ isIntersecting: true }]);
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, false, false]);
    // Scrolled to the very end of the page, the last pin can never pass the line: all reached.
    page.scrollY = page.scrollHeight - page.innerHeight;
    await act(async () => window.dispatchEvent(new Event("scroll")));
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, true, true]);
    expect(pinObserver.disconnected && endObserver.disconnected).toBe(true);
  });

  describe("waiting for the hero entrance", () => {
    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(document, "getAnimations");
    });

    function entrance(name: string, finished: Promise<unknown>) {
      Object.defineProperty(document, "getAnimations", {
        configurable: true,
        value: () => [{ animationName: name, playState: "running", finished }],
      });
    }

    it("criterion 2b: a running hero animation delays the draw until it finishes", async () => {
      let land!: () => void;
      entrance("mini-route-flight", new Promise<void>((resolve) => (land = resolve)));
      const { container } = render(stops());
      const route = container.querySelector("[data-route]")!;
      await fire(observers[0]!, [{ isIntersecting: true }]);
      expect(route.hasAttribute("data-drawn")).toBe(false);
      await act(async () => land());
      expect(route.hasAttribute("data-drawn")).toBe(true);
    });

    it("criterion 2c: an animation that never finishes is released by the timeout", async () => {
      vi.useFakeTimers();
      entrance("name-sweep", new Promise(() => undefined));
      const { container } = render(stops());
      const route = container.querySelector("[data-route]")!;
      await fire(observers[0]!, [{ isIntersecting: true }]);
      expect(route.hasAttribute("data-drawn")).toBe(false);
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(route.hasAttribute("data-drawn")).toBe(true);
    });

    it("ignores animations that are not the hero entrance", async () => {
      entrance("some-scroll-driven-thing", new Promise(() => undefined));
      const { container } = render(stops());
      await fire(observers[0]!, [{ isIntersecting: true }]);
      expect(container.querySelector("[data-route]")!.hasAttribute("data-drawn")).toBe(true);
    });
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

describe("Route at load", () => {
  it("counts the pins already on screen as reached, and no more", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const id = this.getAttribute("data-route-pin");
      return { top: id === "a" ? 100 : id === "b" ? 500 : 2000 } as DOMRect;
    });
    const { container } = render(stops("progressive"));
    const pins = Array.from(container.querySelectorAll<HTMLElement>("[data-route-pin]"));
    expect(pins.map((p) => p.hasAttribute("data-reached"))).toEqual([true, true, false]);
  });

  it("completes a page that cannot scroll as soon as the last pin shows", async () => {
    page.scrollHeight = page.innerHeight;
    const { container } = render(stops("progressive"));
    const pins = Array.from(container.querySelectorAll<HTMLElement>("[data-route-pin]"));
    await fire(observers[1]!, [{ isIntersecting: true }]);
    expect(pins.every((p) => p.hasAttribute("data-reached"))).toBe(true);
  });
});
