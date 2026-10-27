import { readFileSync } from "node:fs";
import { contentAnswer, labProjects, stops } from "../e2e/fixtures/fake-content.mjs";
import { heroFrontEyebrow, heroPeekEyebrow } from "../src/lib/home/hero-tickets";
import { stopEyebrow } from "../src/lib/home/selected-stops";

// The e2e fake serves content rows. This proves none of them can carry a claim the seed does
// not: the seed's stops, lab projects and outcomes are parsed into records, and every fixture
// record must equal its seed record field by field (decision 0005, the claims policy).

const seed = readFileSync("supabase/seed.sql", "utf8");
const code = seed
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

const text = (literal: string) => literal.slice(1, -1).replaceAll("''", "'");
const nullable = (literal: string) => (literal === "null" ? null : text(literal));
const quoted = String.raw`'(?:[^']|'')*'`;
const orNull = String.raw`(?:${quoted}|null)`;

type SeedOutcome = {
  position: number;
  figure: string;
  description: string;
  source_kind: string;
  source_label: string;
  source_url: string;
  checked_on: string;
  claim_scope: string;
  attribution: string | null;
  as_of_year: number | null;
};

/** Every seeded outcome, keyed "stop:<slug>:<position>" or "lab:<slug>:<position>". */
function seededOutcomes() {
  const block = code.slice(code.indexOf("insert into public.outcomes"));
  const tuple = new RegExp(
    String.raw`\(\s*(?:\(select id from public\.stops where slug = '([\w-]+)'\), null|null, \(select id from public\.lab_projects where slug = '([\w-]+)'\)), (\d+),\s+(${quoted}), (${quoted}),\s+'(link|own)', (${quoted}), (${quoted}), date '([\d-]+)',\s+'(\w+)', (${orNull}), (null|\d+)\)`,
    "g",
  );
  const records = new Map<string, SeedOutcome>();
  for (const m of block.matchAll(tuple)) {
    const [, stop, lab, position, figure, description, kind, label, url, checked, scope, attribution, year] =
      m;
    records.set(`${stop ? "stop" : "lab"}:${stop ?? lab}:${position}`, {
      position: Number(position),
      figure: text(figure!),
      description: text(description!),
      source_kind: kind!,
      source_label: text(label!),
      source_url: text(url!),
      checked_on: checked!,
      claim_scope: scope!,
      attribution: nullable(attribution!),
      as_of_year: year === "null" ? null : Number(year),
    });
  }
  return records;
}

const fixtureOutcomes = () => [
  ...stops.flatMap((row) => row.outcomes.map((outcome) => ({ key: `stop:${row.slug}`, outcome }))),
  ...labProjects.flatMap((row) => row.outcomes.map((outcome) => ({ key: `lab:${row.slug}`, outcome }))),
];

describe("the fake content in e2e/fixtures/fake-content.mjs", () => {
  it("parses every seeded outcome (a guard for the parser itself)", () => {
    expect(seededOutcomes().size).toBe(9);
  });

  it("equals the seed record for every stop: slug, name, kind, filters, years, via, role and summary", () => {
    for (const stop of stops) {
      const row = new RegExp(
        String.raw`\('${stop.slug}', (\d+), '([^']+)', '(\w+)', '\{([\w,]+)\}', (\d+), (\d+|null), (${orNull}), 'published'\)`,
      ).exec(code);
      expect(row, `${stop.slug} is seeded`).not.toBeNull();
      expect({
        number: Number(row![1]),
        name: row![2],
        kind: row![3],
        filters: row![4]!.split(","),
        start_year: Number(row![5]),
        end_year: row![6] === "null" ? null : Number(row![6]),
        via: nullable(row![7]!),
      }).toEqual({
        number: stop.number,
        name: stop.name,
        kind: stop.kind,
        filters: stop.filters,
        start_year: stop.start_year,
        end_year: stop.end_year,
        via: stop.via,
      });
      const role = new RegExp(
        String.raw`update public\.stops set role = (${quoted}) where slug = '${stop.slug}';`,
      ).exec(code);
      expect(role ? text(role[1]!) : null, `${stop.slug} role`).toEqual(stop.role);
      const summary = new RegExp(
        String.raw`update public\.stops set summary = (${quoted}) where slug = '${stop.slug}';`,
      ).exec(code);
      expect(summary ? text(summary[1]!) : null, `${stop.slug} summary`).toEqual(stop.summary);
    }
  });

  it("equals the seed record for every lab project: links, in_progress, position, checked date and summary", () => {
    for (const project of labProjects) {
      const row = new RegExp(
        String.raw`\('${project.slug}', (${quoted}), (true|false), (${orNull}), (${orNull}), (${orNull}),\s+(?:\(select [^)]*\)|null), (?:date '([\d-]+)'|null), (\d+), 'published'\)`,
      ).exec(code);
      expect(row, `${project.slug} is seeded`).not.toBeNull();
      expect({
        name: text(row![1]!),
        in_progress: row![2] === "true",
        repo_url: nullable(row![3]!),
        live_url: nullable(row![4]!),
        video_url: nullable(row![5]!),
        links_checked_on: row![6] ?? null,
        position: Number(row![7]),
      }).toEqual({
        name: project.name,
        in_progress: project.in_progress,
        repo_url: project.repo_url,
        live_url: project.live_url,
        video_url: project.video_url,
        links_checked_on: project.links_checked_on,
        position: project.position,
      });
      const summary = new RegExp(
        String.raw`update public\.lab_projects set summary = (${quoted}) where slug = '${project.slug}';`,
      ).exec(code);
      expect(summary ? text(summary[1]!) : null, `${project.slug} summary`).toEqual(project.summary);
    }
  });

  it("equals the seed record for every outcome, field by field, under the same owner and position", () => {
    const seeded = seededOutcomes();
    const outcomes = fixtureOutcomes();
    expect(outcomes.length).toBeGreaterThan(0);
    for (const { key, outcome } of outcomes) {
      const record = seeded.get(`${key}:${outcome.position}`);
      expect(record, `${key}:${outcome.position} is in the seed`).toBeDefined();
      expect({
        position: outcome.position,
        figure: outcome.figure,
        description: outcome.description,
        source_kind: outcome.source_kind,
        source_label: outcome.source_label,
        source_url: outcome.source_url,
        checked_on: outcome.checked_on,
        claim_scope: outcome.claim_scope,
        attribution: outcome.attribution,
        as_of_year: outcome.as_of_year,
      }).toEqual(record);
    }
  });

  it("answers like PostgREST: rows, an empty array, or a 500, and nothing for other tables", () => {
    expect(contentAnswer("stops", "ok")?.status).toBe(200);
    expect((contentAnswer("stops", "ok")?.body as unknown[]).length).toBe(7);
    expect((contentAnswer("lab_projects", "ok")?.body as unknown[]).length).toBe(4);
    expect(contentAnswer("stops", "empty")).toEqual({ status: 200, body: [] });
    expect(contentAnswer("lab_projects", "error")?.status).toBe(500);
    expect(contentAnswer("feature_flags", "ok")).toBeNull();
  });

  it("keeps the static hero ticket labels in step with the HBK and Galooli rows", () => {
    const toStop = (slug: string) => {
      const row = stops.find((stop) => stop.slug === slug)!;
      return { role: row.role, via: row.via, startYear: row.start_year, endYear: row.end_year };
    };
    expect(heroFrontEyebrow).toEqual(stopEyebrow(toStop("hbk")));
    const galooli = stopEyebrow(toStop("galooli"));
    expect(heroPeekEyebrow).toBe(`${galooli.meta} \u00b7 Galooli`);
  });
});
