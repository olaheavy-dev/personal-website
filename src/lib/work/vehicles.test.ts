import { success } from "@/lib/db/result";
import type { Stop } from "@/lib/db/types";
import { buildWorkRoute } from "./route";
import { entryKey, planWorkVehicles } from "./vehicles";

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
  stack: [],
  outcomes: [],
  ...more,
});

const deimos = { via: "Deimos" } as const;
const all = [
  stop("galooli", 1),
  stop("access-bank", 2),
  stop("stanbic-ibtc", 3),
  stop("optty", 4, deimos),
  stop("ulesson", 5, deimos),
  stop("mukuru", 6, deimos),
  stop("hbk", 7, { endYear: null }),
];

const modelOf = (rows: Stop[]) => {
  const model = buildWorkRoute(success(rows), {}, "public", { caseStudies: [] });
  if (model.unavailable) throw new Error("unavailable");
  return model;
};
const plan = (rows: Stop[]) => planWorkVehicles(modelOf(rows));

describe("planWorkVehicles", () => {
  it("parks a danfo at every Lagos entry, newest first, and rests it at the one nearest the UK", () => {
    expect(plan(all)).toMatchObject({
      danfoAt: ["Deimos", "stanbic-ibtc", "access-bank", "galooli"],
      danfoHome: "Deimos",
    });
  });

  it("never puts the danfo at the UK entry", () => {
    expect(plan(all).danfoAt).not.toContain("hbk");
  });

  it("waits the bus at the UK end of the handover and rides the plane on the leg below it", () => {
    expect(plan(all)).toMatchObject({ busAt: "hbk", planeLegAt: "hbk" });
  });

  it("shows neither bus nor plane when the Lagos end of the handover is not in the list", () => {
    const model = modelOf(all);
    const entries = [model.entries[0]!, model.entries[2]!, ...model.entries.slice(3)];
    const result = planWorkVehicles({ entries, handover: { fromSlug: "mukuru", toSlug: "hbk" } });
    expect(result).toMatchObject({ busAt: null, planeLegAt: null });
  });

  it("keeps the bus but has no plane when the two ends of the handover are not neighbours", () => {
    const skipped = planWorkVehicles({
      entries: modelOf(all).entries,
      handover: { fromSlug: "galooli", toSlug: "hbk" },
    });
    expect(skipped).toMatchObject({ busAt: "hbk", planeLegAt: null });
  });

  it("shows no bus or plane without a handover, and no danfo without a Lagos entry", () => {
    expect(plan([stop("hbk", 7), stop("uk-two", 8)])).toEqual({
      danfoAt: [],
      danfoHome: null,
      busAt: null,
      planeLegAt: null,
    });
    expect(plan([stop("galooli", 1)])).toMatchObject({ danfoAt: ["galooli"], busAt: null, planeLegAt: null });
  });

  it("keys a group by the consultancy and a stop by its slug", () => {
    expect(modelOf(all).entries.map(entryKey)).toEqual([
      "hbk",
      "Deimos",
      "stanbic-ibtc",
      "access-bank",
      "galooli",
    ]);
  });
});
