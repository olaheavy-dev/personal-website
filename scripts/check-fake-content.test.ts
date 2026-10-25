import { readFileSync } from "node:fs";
import { contentAnswer, labProjects, stops, type FakeRow } from "../e2e/fixtures/fake-content.mjs";

// The e2e fake serves content rows. This proves none of them can carry a claim the seed does
// not: every figure, wording, link, name and year in the fixture is read back out of
// supabase/seed.sql (decision 0005, the claims policy).

const seed = readFileSync("supabase/seed.sql", "utf8");
const sql = (text: string) => `'${text.replaceAll("'", "''")}'`;
const inSeed = (text: string) => seed.includes(sql(text));

function everyOutcome() {
  return [...stops, ...labProjects].flatMap((row: FakeRow) =>
    row.outcomes.map((outcome) => ({ row, outcome })),
  );
}

describe("the fake content in e2e/fixtures/fake-content.mjs", () => {
  it("names only stops and lab projects that the seed seeds, with the seed's numbers and years", () => {
    for (const stop of stops) {
      expect(inSeed(stop.slug), `${stop.slug} slug`).toBe(true);
      expect(inSeed(stop.name), `${stop.slug} name`).toBe(true);
      const seeded = new RegExp(
        `\\('${stop.slug}', ${stop.number}, '${stop.name}', '${stop.kind}', '\\{${(stop.filters as string[]).join(",")}\\}', ${stop.start_year}, ${stop.end_year ?? "null"}, ${stop.via ? `'${stop.via}'` : "null"}, 'published'\\)`,
      );
      expect(seed, `${stop.slug} row`).toMatch(seeded);
    }
    for (const project of labProjects) {
      expect(inSeed(project.slug), `${project.slug} slug`).toBe(true);
      expect(inSeed(project.name), `${project.slug} name`).toBe(true);
      for (const key of ["repo_url", "live_url", "video_url"] as const) {
        const url = project[key] as string | null;
        if (url) expect(inSeed(url), `${project.slug} ${key}`).toBe(true);
      }
    }
  });

  it("carries a summary only where the seed sets exactly that summary", () => {
    for (const row of [...stops, ...labProjects]) {
      if (row.summary === null) continue;
      const table = stops.includes(row) ? "stops" : "lab_projects";
      expect(seed, `${row.slug} summary`).toContain(
        `update public.${table} set summary = ${sql(row.summary)} where slug = '${row.slug}';`,
      );
    }
  });

  it("carries only outcomes that the seed seeds, figure, wording, source and attribution together", () => {
    const outcomes = everyOutcome();
    expect(outcomes.length).toBeGreaterThan(0);
    for (const { row, outcome } of outcomes) {
      const where = `${row.slug} outcome ${outcome.figure}`;
      const line = [outcome.figure, outcome.description].map((text) => sql(text)).join(", ");
      expect(seed, where).toContain(line);
      expect(inSeed(outcome.source_label as string), `${where} label`).toBe(true);
      expect(inSeed(outcome.source_url as string), `${where} url`).toBe(true);
      const claim = outcome.attribution
        ? `'${outcome.claim_scope}', ${sql(outcome.attribution)}, ${outcome.as_of_year}`
        : `'${outcome.claim_scope}', null, null`;
      expect(seed, `${where} scope`).toContain(claim);
    }
  });

  it("belongs to the right owner: each figure sits under the same stop or project as in the seed", () => {
    const seeded = [
      ...seed.matchAll(
        /^\s+(?:\(\(select id from public\.\w+ where slug = '([\w-]+)'\)|\(null, \(select id from public\.\w+ where slug = '([\w-]+)'\)), (?:null, )?\d,\n\s+'([^']+)'/gm,
      ),
    ];
    const fixture = everyOutcome().map(({ row, outcome }) => `${row.slug}:${outcome.figure}`);
    const seededPairs = new Set(seeded.map((match) => `${match[1] ?? match[2]}:${match[3]}`));
    expect(seededPairs.size).toBeGreaterThan(0);
    for (const pair of fixture)
      expect(seededPairs.has(pair), `${pair} under the same owner in the seed`).toBe(true);
  });

  it("answers like PostgREST: rows, an empty array, or a 500, and nothing for other tables", () => {
    expect(contentAnswer("stops", "ok")?.status).toBe(200);
    expect((contentAnswer("stops", "ok")?.body as unknown[]).length).toBe(7);
    expect((contentAnswer("lab_projects", "ok")?.body as unknown[]).length).toBe(4);
    expect(contentAnswer("stops", "empty")).toEqual({ status: 200, body: [] });
    expect(contentAnswer("lab_projects", "error")?.status).toBe(500);
    expect(contentAnswer("feature_flags", "ok")).toBeNull();
  });
});
