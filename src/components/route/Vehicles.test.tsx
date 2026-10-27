import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { success } from "@/lib/db/result";
import type { Stop } from "@/lib/db/types";
import { WorkRoute } from "@/components/work/WorkRoute";
import { buildWorkRoute } from "@/lib/work/route";
import { Route } from "./Route";
import { RoutePin } from "./RoutePin";
import { ParkedVehicle, VehicleSprites } from "./Vehicles";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observers: FakeObserver[] = [];
class FakeObserver {
  constructor(public callback: Callback) {
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const stop = (slug: string, number: number, more: Partial<Stop> = {}): Stop => ({
  id: slug,
  slug,
  number,
  name: slug,
  kind: "compact",
  filters: [],
  startYear: 2020,
  endYear: 2022,
  via: null,
  role: "Engineer",
  summary: null,
  details: [],
  detailSources: [],
  stack: [],
  outcomes: [],
  ...more,
});
const deimos = { via: "Deimos" } as const;
const stops = [
  stop("galooli", 1),
  stop("access-bank", 2),
  stop("stanbic-ibtc", 3),
  stop("ulesson", 5, deimos),
  stop("mukuru", 6, deimos),
  stop("hbk", 7, { endYear: null }),
];

function renderWork() {
  const model = buildWorkRoute(success(stops), {}, "public", { caseStudies: [] });
  if (model.unavailable) throw new Error("unavailable");
  return render(<WorkRoute entries={model.entries} handover={model.handover} />);
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

describe("VehicleSprites", () => {
  it("draws each vehicle once as a symbol, hidden from assistive technology", () => {
    const { container } = render(<VehicleSprites />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    for (const id of ["vehicle-danfo", "vehicle-bus", "vehicle-danfo-pin", "vehicle-bus-pin"]) {
      expect(container.querySelectorAll(`symbol#${id}`)).toHaveLength(1);
    }
    expect(container.querySelectorAll("#vehicle-danfo-door")).toHaveLength(1);
    expect(container.textContent).toBe("");
  });
});

describe("ParkedVehicle", () => {
  it("references the symbols instead of repeating the art, and says which way it faces", () => {
    const { container } = render(<ParkedVehicle kind="danfo" at="Deimos" home />);
    const slot = container.querySelector("[data-vehicle]")!;
    expect(slot.getAttribute("data-vehicle")).toBe("danfo");
    expect(slot.getAttribute("data-direction")).toBe("right");
    expect(slot.getAttribute("data-door")).toBe("open");
    expect(slot.getAttribute("aria-hidden")).toBe("true");
    expect([...slot.querySelectorAll("use")].map((u) => u.getAttribute("href"))).toEqual([
      "#vehicle-danfo",
      "#vehicle-danfo-door",
      "#vehicle-danfo-pin",
    ]);
    expect(slot.querySelectorAll("path, rect, circle")).toHaveLength(0);
  });

  it("gives the bus no door and no lettering", () => {
    const { container } = render(<ParkedVehicle kind="bus" at="hbk" home />);
    const slot = container.querySelector("[data-vehicle]")!;
    expect(slot.hasAttribute("data-door")).toBe(false);
    expect(slot.textContent).toBe("");
  });
});

describe("WorkRoute vehicles", () => {
  it("renders the sprites once and a danfo only at Lagos entries, parked at the Deimos entry", () => {
    const { container } = renderWork();
    expect(container.querySelectorAll("[data-vehicle-sprites]")).toHaveLength(1);
    const danfos = [...container.querySelectorAll("[data-vehicle='danfo']")];
    expect(danfos.map((d) => d.getAttribute("data-parked-at"))).toEqual([
      "Deimos",
      "stanbic-ibtc",
      "access-bank",
      "galooli",
    ]);
    expect(
      danfos.filter((d) => d.hasAttribute("data-home")).map((d) => d.getAttribute("data-parked-at")),
    ).toEqual(["Deimos"]);
    expect(danfos.map((d) => d.getAttribute("data-door"))).toEqual(["open", "closed", "closed", "closed"]);
    // The pins of those entries carry the danfo group; HBK carries the bus group.
    const parks = [...container.querySelectorAll("[data-route-pin]")].map((p) =>
      p.getAttribute("data-route-park"),
    );
    expect(parks).toEqual(["bus", "danfo", "danfo", "danfo", "danfo"]);
  });

  it("waits the bus beside HBK and sits each parked vehicle inside the rail text", () => {
    const { container } = renderWork();
    const bus = container.querySelector("[data-vehicle='bus']")!;
    expect(bus.getAttribute("data-parked-at")).toBe("hbk");
    expect(bus.closest("[data-rail]")).not.toBeNull();
    expect(container.querySelectorAll("[data-vehicle='bus']")).toHaveLength(1);
  });

  it("rides the paper plane on the handover leg, nose up towards HBK", () => {
    const { container } = renderWork();
    const planes = container.querySelectorAll("[data-vehicle='plane']");
    expect(planes).toHaveLength(1);
    const leg = planes[0]!.closest("[data-route-leg]")!;
    const pins = [...container.querySelectorAll("[data-route-pin]")];
    // The leg after the HBK pin runs to the Deimos entry: it is HBK's pin that precedes it.
    expect(leg.previousElementSibling).toBe(pins[0]);
    expect(pins[0]!.getAttribute("data-route-pin")).toBe("hbk");
    expect(leg.querySelector(".route-vehicle")!.getAttribute("data-direction")).toBe("up");
  });

  it("is hidden from assistive technology and adds no tab stop", () => {
    const { container } = renderWork();
    for (const slot of container.querySelectorAll("[data-vehicle]")) {
      expect(slot.closest("[aria-hidden='true']")).not.toBeNull();
    }
    expect(container.querySelectorAll("[data-route] :is(a[href], button, [tabindex])").length).toBe(
      container.querySelectorAll("[data-route] .ticket a[href], [data-route] button").length,
    );
  });

  it("offers a hook for filters: the route says whether its vehicles are shown", () => {
    const { container } = renderWork();
    expect(container.querySelector("[data-route]")!.getAttribute("data-vehicles")).toBe("shown");
    const hidden = render(
      <Route variant="vertical" vehicles="hidden">
        <RoutePin id="a" />
      </Route>,
    );
    expect(hidden.container.querySelector("[data-route]")!.getAttribute("data-vehicles")).toBe("hidden");
  });
});

describe("RouteObserver and the parked vehicles", () => {
  const reach = async (pins: HTMLElement[], upTo: number) => {
    const io = observers[0]!;
    await act(async () =>
      io.callback(
        pins.slice(0, upTo + 1).map((target) => ({
          target,
          isIntersecting: true,
          boundingClientRect: { top: 0 } as DOMRectReadOnly,
          rootBounds: { bottom: 500 } as DOMRectReadOnly,
        })),
      ),
    );
  };
  const latest = (container: HTMLElement) =>
    [...container.querySelectorAll("[data-parked-at][data-latest]")].map((s) =>
      s.getAttribute("data-parked-at"),
    );

  it("shows the danfo at the latest reached Lagos pin, with its door open there only", async () => {
    const { container } = renderWork();
    const pins = [...container.querySelectorAll<HTMLElement>("[data-route-pin]")];
    await reach(pins, 0); // only HBK
    expect(latest(container)).toEqual(["hbk"]);
    await reach(pins, 1);
    expect(latest(container)).toEqual(["hbk", "Deimos"]);
    await reach(pins, 2);
    expect(latest(container)).toEqual(["hbk", "stanbic-ibtc"]);
    const doors = [...container.querySelectorAll("[data-vehicle='danfo']")].map((d) =>
      d.getAttribute("data-door"),
    );
    expect(doors).toEqual(["closed", "open", "closed", "closed"]);
    expect(container.querySelectorAll("[data-vehicle='danfo'][data-latest]")).toHaveLength(1);
  });

  it("leaves the vehicles parked at home with reduced motion", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    const { container } = renderWork();
    const pins = [...container.querySelectorAll<HTMLElement>("[data-route-pin]")];
    await reach(pins, 3);
    expect(latest(container)).toEqual([]);
    expect(container.querySelector("[data-vehicle='danfo'][data-home]")!.getAttribute("data-door")).toBe(
      "open",
    );
  });
});
