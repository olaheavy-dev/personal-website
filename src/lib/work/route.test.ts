import { failure, success } from "@/lib/db/result";
import type { FeatureFlags, Outcome, Stop } from "@/lib/db/types";
import type { CaseStudyEntry } from "@/lib/flags/registry";
import { buildWorkRoute, parseWorkFilter, ukFromStopNumber, workFilterOptions } from "./route";

const chip: Outcome = {
  id: "o1",
  figure: "90+",
  description: "methods",
  source: { kind: "link", label: "Source", url: "https://example.com" },
  checkedOn: "2026-10-25",
  scope: "company",
  attribution: "Optty",
  asOfYear: 2023,
};

function stop(slug: string, number: number, more: Partial<Stop> = {}): Stop {
  return {
    id: slug,
    slug,
    number,
    name: slug.toUpperCase(),
    kind: "compact",
    filters: ["payments"],
    startYear: 2020,
    endYear: 2022,
    via: null,
    role: "Senior Software Engineer",
    summary: `About ${slug}.`,
    details: [],
    stack: [],
    outcomes: [],
    ...more,
  };
}

const deimos = { via: "Deimos", startYear: 2022, endYear: 2024 } as const;
const galooli = stop("galooli", 1, { filters: ["data-iot"], role: "Technical Support Engineer" });
const accessBank = stop("access-bank", 2, { kind: "flagship", outcomes: [chip] });
const stanbic = stop("stanbic-ibtc", 3);
const optty = stop("optty", 4, { kind: "flagship", ...deimos });
const ulesson = stop("ulesson", 5, { filters: ["edtech"], ...deimos });
const mukuru = stop("mukuru", 6, { ...deimos });
const hbk = stop("hbk", 7, {
  kind: "flagship",
  filters: ["ai", "data-iot"],
  role: "Backend Software Engineer",
  startYear: 2024,
  endYear: null,
});
// Deliberately out of order: the model sorts.
const all = [galooli, mukuru, hbk, optty, accessBank, ulesson, stanbic];

const on = (...keys: string[]): FeatureFlags => Object.fromEntries(keys.map((key) => [key, "on" as const]));
const caseLive: CaseStudyEntry[] = [
  { slug: "optty", flag: "case.optty", stopSlug: "optty", status: "live" },
  { slug: "access-bank", flag: "case.access-bank", stopSlug: "access-bank", status: "planned" },
];

function route(...args: Parameters<typeof buildWorkRoute>) {
  const model = buildWorkRoute(...args);
  if (model.unavailable) throw new Error("expected a route");
  return model;
}

describe("buildWorkRoute", () => {
  it("lists the stops newest first, whatever order they were read in, with Deimos as one group", () => {
    const model = route(success(all), {}, "public");
    expect(
      model.entries.map((entry) => (entry.type === "stop" ? entry.ticket.slug : `group:${entry.via}`)),
    ).toEqual(["hbk", "group:Deimos", "stanbic-ibtc", "access-bank", "galooli"]);
  });

  it("gives the Deimos group the role and years for the rail, and marks the current stop", () => {
    const model = route(success(all), {}, "public");
    const group = model.entries[1]!;
    expect(group.type === "group" && [group.role, group.years]).toEqual([
      "Senior Software Engineer",
      "2022 to 2024",
    ]);
    const first = model.entries[0]!;
    expect(first.type === "stop" && first.ticket.current).toBe(true);
    expect(
      model.entries.at(-1)!.type === "stop" &&
        (model.entries.at(-1) as { ticket: { current: boolean } }).ticket.current,
    ).toBe(false);
  });

  it("puts the three Deimos clients in the group, newest first by stop number, under the derived heading", () => {
    const group = route(success(all), {}, "public").entries[1]!;
    expect(group.type).toBe("group");
    if (group.type !== "group") return;
    expect(group.tickets.map((ticket) => ticket.slug)).toEqual(["mukuru", "ulesson", "optty"]);
    expect(group.heading).toBe("Deimos · Senior Software Engineer · 2022 to 2024");
  });

  it("falls back to 'Deimos' as the heading when the rows disagree", () => {
    const model = route(success([hbk, mukuru, { ...optty, role: "Tech Lead" }]), {}, "public");
    const group = model.entries[1]!;
    expect(group.type === "group" && group.heading).toBe("Deimos");
  });

  it("labels Deimos clients 'via Deimos' with no role, and other stops with role over years", () => {
    const model = route(success(all), {}, "public");
    const [first, group, , , last] = model.entries;
    expect(first!.type === "stop" && first!.ticket.eyebrow).toEqual({
      role: "Backend Software Engineer",
      meta: "2024 to now",
    });
    expect(group!.type === "group" && group!.tickets.map((ticket) => ticket.eyebrow)).toEqual([
      { role: null, meta: "via Deimos" },
      { role: null, meta: "via Deimos" },
      { role: null, meta: "via Deimos" },
    ]);
    expect(last!.type === "stop" && last!.ticket.eyebrow).toEqual({
      role: "Technical Support Engineer",
      meta: "2020 to 2022",
    });
  });

  it("gives the Deimos group the union of its tickets' areas, in chip order", () => {
    const group = route(success(all), {}, "public").entries[1]!;
    expect(group.type === "group" && group.filters).toEqual(["payments", "edtech"]);
    const mixed = route(
      success([hbk, { ...mukuru, filters: ["data-iot"] }, { ...optty, filters: ["ai", "data-iot"] }]),

      {},
      "public",
    ).entries[1]!;
    expect(mixed.type === "group" && mixed.filters).toEqual(["ai", "data-iot"]);
  });

  it("names the handover leg: the newest Lagos stop to HBK, or none when a side was not read", () => {
    expect(route(success(all), {}, "public").handover).toEqual({ fromSlug: "mukuru", toSlug: "hbk" });
    expect(route(success([hbk, galooli]), {}, "public").handover).toEqual({
      fromSlug: "galooli",
      toSlug: "hbk",
    });
    expect(route(success([galooli, stanbic]), {}, "public").handover).toBeNull();
    expect(route(success([hbk]), {}, "public").handover).toBeNull();
  });

  it("marks HBK as the UK and every earlier stop as Lagos, from one constant", () => {
    const model = route(success(all), {}, "public");
    const tickets = model.entries.flatMap((entry) =>
      entry.type === "stop" ? [entry.ticket] : entry.tickets,
    );
    for (const ticket of tickets)
      expect(ticket.era, ticket.slug).toBe(ticket.number >= ukFromStopNumber ? "uk" : "lagos");
    expect(tickets.find((ticket) => ticket.slug === "hbk")!.era).toBe("uk");
    expect(tickets.filter((ticket) => ticket.era === "lagos")).toHaveLength(6);
    expect(ukFromStopNumber).toBe(hbk.number);
  });

  it("links a stop only through caseStudyHref: live and visible, else no link", () => {
    const find = (model: ReturnType<typeof route>, slug: string) =>
      model.entries
        .flatMap((entry) => (entry.type === "stop" ? [entry.ticket] : entry.tickets))
        .find((ticket) => ticket.slug === slug)!;
    const none = route(success(all), on("case.optty"), "public");
    expect(find(none, "optty").href).toBeNull();
    const live = route(success(all), on("case.optty", "case.access-bank"), "public", {
      caseStudies: caseLive,
    });
    expect(find(live, "optty").href).toBe("/work/optty");
    expect(find(live, "access-bank").href).toBeNull();
    const hidden = route(success(all), {}, "public", { caseStudies: caseLive });
    expect(find(hidden, "optty").href).toBeNull();
    expect(find(live, "mukuru").href).toBeNull();
  });

  it("carries the summary, details and first outcome, and nothing for what is missing", () => {
    const rich = stop("stanbic-ibtc", 3, {
      summary: "  ",
      details: [" one ", "", "two", "three", "four", "five"],
      outcomes: [chip],
    });
    const ticket = route(success([hbk, rich]), {}, "public").entries[1]!;
    expect(ticket.type === "stop" && ticket.ticket).toMatchObject({
      summary: null,
      details: ["one", "two", "three", "four"],
      outcome: chip,
    });
    const bare = route(success([hbk, stop("galooli", 1)]), {}, "public").entries[1]!;
    expect(bare.type === "stop" && bare.ticket).toMatchObject({ details: [], outcome: null });
  });

  it("offers All plus only the areas that have a stop, in the fixed order", () => {
    const model = route(success(all), {}, "public");
    expect(model.chips.map((c) => [c.param, c.label, c.href])).toEqual([
      [null, "All", "/work"],
      ["ai", "AI", "/work?filter=ai"],
      ["payments", "Payments & banking", "/work?filter=payments"],
      ["data-iot", "Data & IoT", "/work?filter=data-iot"],
      ["edtech", "Edtech", "/work?filter=edtech"],
    ]);
    const partial = route(success([accessBank, stanbic]), {}, "public");
    expect(partial.chips.map((c) => c.label)).toEqual(["All", "Payments & banking"]);
  });

  it("keeps a partial read: only the stops that were read", () => {
    const model = route(success([hbk, galooli]), {}, "public");
    expect(model.entries).toHaveLength(2);
  });

  it("is unavailable when the read failed or came back empty", () => {
    expect(buildWorkRoute(failure("query_failed", "down"), {}, "public")).toEqual({
      unavailable: true,
    });
    expect(buildWorkRoute(success([]), {}, "public")).toEqual({ unavailable: true });
  });
});

describe("parseWorkFilter", () => {
  it("accepts each of the four areas", () => {
    for (const { param } of workFilterOptions) expect(parseWorkFilter(param)).toBe(param);
  });

  it("is All (null) for missing, empty, unknown or wrongly cased values", () => {
    for (const value of [undefined, null, "", "all", "AI", "data_iot", "payments ", "nope"]) {
      expect(parseWorkFilter(value), String(value)).toBeNull();
    }
  });

  it("uses the first value of a repeated key", () => {
    expect(parseWorkFilter(["edtech", "ai"])).toBe("edtech");
    expect(parseWorkFilter(["nope", "ai"])).toBeNull();
    expect(parseWorkFilter([])).toBeNull();
  });
});
