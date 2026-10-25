import { createPublicClient } from "../public-client";
import { loadFlags } from "../queries/flags";
import { loadLabProjects } from "../queries/lab";
import { loadSettings } from "../queries/settings";
import { loadStops } from "../queries/stops";
import { loadCountries } from "../queries/travel";

// Smoke test against a real project (the hosted one after `supabase db push` and the
// seed, or the local one). It reads with the publishable key, exactly as the site does.

const client = createPublicClient();
if (!client.ok) {
  throw new Error(`Supabase is not configured for the smoke test: ${client.message}`);
}
const db = client.data;

describe("the seeded project", () => {
  it("returns the seven stops with their sourced outcomes", async () => {
    const stops = await loadStops(db);
    expect(stops.ok).toBe(true);
    if (!stops.ok) return;
    expect(stops.data.map((stop) => stop.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const figures = stops.data.flatMap((stop) => stop.outcomes.map((outcome) => outcome.figure));
    expect(figures.sort()).toEqual(["1M+", "2025 R4", "90+", "~11%"].sort());
  });

  it("returns the four lab projects", async () => {
    const lab = await loadLabProjects(db);
    expect(lab.ok && lab.data.map((project) => project.slug)).toEqual([
      "foresight",
      "fastpilot",
      "homescout",
      "sabitutor",
    ]);
  });

  it("returns the countries, with Nigeria as home", async () => {
    const countries = await loadCountries(db);
    expect(countries.ok && countries.data[0]?.slug).toBe("nigeria");
  });

  it("returns the settings and only page.home as an on flag", async () => {
    const settings = await loadSettings(db);
    expect(settings.ok && settings.data.name).toBe("Sunkanmi Olawuwo");
    const flags = await loadFlags(db);
    expect(flags.ok && Object.keys(flags.data)).toEqual(["page.home"]);
  });

  it("keeps the server only tables closed to the publishable key", async () => {
    const chunks = await db.from("kb_chunks").select("id").limit(1);
    expect(chunks.error?.code).toBe("42501");
    const evals = await db.from("assistant_evals").select("id").limit(1);
    expect(evals.error?.code).toBe("42501");
  });

  it("refuses a write with the publishable key", async () => {
    const write = await db.from("feature_flags").update({ state: "on" }).eq("key", "page.work");
    expect(write.error?.code).toBe("42501");
  });
});
