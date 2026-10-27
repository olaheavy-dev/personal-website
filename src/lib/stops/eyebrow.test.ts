import type { Stop } from "@/lib/db/types";
import { stopEyebrow } from "./eyebrow";

const base: Stop = {
  id: "x",
  slug: "x",
  number: 1,
  name: "X",
  kind: "compact",
  filters: [],
  startYear: 2020,
  endYear: 2022,
  via: null,
  role: "Senior Software Engineer",
  summary: null,
  details: [],
  detailSources: [],
  stack: [],
  outcomes: [],
};
const access = base;
const optty: Stop = { ...base, via: "Deimos", startYear: 2022, endYear: 2024 };
const mukuru = optty;
const hbk: Stop = { ...base, role: "Backend Software Engineer", startYear: 2024, endYear: null };

describe("stopEyebrow", () => {
  it("is role over years, from the owner's CV", () => {
    expect(stopEyebrow(hbk)).toEqual({ role: "Backend Software Engineer", meta: "2024 to now" });
    expect(stopEyebrow(access)).toEqual({ role: "Senior Software Engineer", meta: "2020 to 2022" });
  });

  it("shows only 'via Deimos' for a Deimos client: no role and no years", () => {
    expect(stopEyebrow(optty)).toEqual({ role: null, meta: "via Deimos" });
    expect(stopEyebrow(mukuru)).toEqual({ role: null, meta: "via Deimos" });
  });

  it("keeps the role and years on the Deimos rows' data, only the label changes", () => {
    expect(optty.role).toBe("Senior Software Engineer");
    expect(optty.startYear).toBe(2022);
  });

  it("shows the years only when the stop has no role", () => {
    expect(stopEyebrow({ ...access, role: null })).toEqual({ role: null, meta: "2020 to 2022" });
  });
});
