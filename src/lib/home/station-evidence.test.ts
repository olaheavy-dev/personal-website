import type { CaseStudyEntry } from "@/lib/flags/registry";
import { caseStudyRegistry } from "@/lib/flags/registry";
import { stationEvidence, stationEvidenceHref, type StationName } from "./station-evidence";

const stations = Object.keys(stationEvidence) as StationName[];
const live: CaseStudyEntry[] = caseStudyRegistry.map((entry) => ({ ...entry, status: "live" }));
const everythingOn = Object.fromEntries(caseStudyRegistry.map((entry) => [entry.flag, "on" as const]));

describe("caseStudyRegistry", () => {
  it("lists the four case studies, all planned, each with a case.* flag", () => {
    expect(caseStudyRegistry.map((entry) => entry.slug)).toEqual([
      "hbk-aiana",
      "optty",
      "access-bank",
      "foresight",
    ]);
    expect(caseStudyRegistry.every((entry) => entry.status === "planned")).toBe(true);
    expect(caseStudyRegistry.every((entry) => entry.flag === `case.${entry.slug}`)).toBe(true);
  });
});

describe("stationEvidence", () => {
  it("points every station at a case study in the registry", () => {
    expect(stations).toEqual(["Idea", "Design", "Build", "Ship", "Scale"]);
    for (const station of stations) {
      expect(caseStudyRegistry.map((entry) => entry.slug)).toContain(stationEvidence[station].caseStudy);
    }
  });

  it("shows no link today: every case study is planned, even with every flag on", () => {
    for (const station of stations) {
      expect(stationEvidenceHref(station, everythingOn, "public")).toBeNull();
    }
  });

  it("links the section once its case study is live and its flag is on", () => {
    expect(stationEvidenceHref("Design", everythingOn, "public", live)).toBe("/work/hbk-aiana#design");
    expect(stationEvidenceHref("Ship", everythingOn, "public", live)).toBe("/work/access-bank#production");
  });

  it("stays hidden for a live case study whose flag is off or Preview", () => {
    expect(stationEvidenceHref("Build", {}, "public", live)).toBeNull();
    expect(stationEvidenceHref("Build", { "case.optty": "preview" }, "public", live)).toBeNull();
  });
});
