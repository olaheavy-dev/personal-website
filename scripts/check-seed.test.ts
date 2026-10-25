import { readFileSync } from "node:fs";

// The seed is public content, so it follows the claims policy (decision 0005) and the
// personal data rules. The pgTAP test seed_claims.test.sql checks what the database
// holds; this checks the file itself for things that must never be written in it.

const seed = readFileSync("supabase/seed.sql", "utf8");
const code = seed
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

const allowedLinks = new Set([
  "https://olaheavy.dev",
  "https://github.com/olaheavy-dev/Foresight",
  "https://github.com/olaheavy-dev/fastpilot",
  "https://github.com/olaheavy-dev/homescout-platform",
  "https://foresight.olaheavy.dev",
  "https://www.loom.com/share/a1d6bf3ee7c54e5c93de4ac8c280992f",
  "https://play.google.com/store/apps/details?id=com.accessbankplc.quickbucks",
  "https://triple-a.io/newsroom/optty-partners-with-triple-a-to-expand-payment-architectures-into-digital-currencies",
  "https://galooli.com/case-studies/deep-dive-into-remote-site-energy-use/",
  "https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights",
]);

describe("supabase/seed.sql", () => {
  it("never mentions RagLab", () => {
    expect(code.toLowerCase()).not.toContain("raglab");
  });

  it("holds no email address or phone number", () => {
    expect(code).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/);
    expect(code).not.toMatch(/\+\d[\d ()-]{7,}/);
    expect(code).not.toMatch(/\b0\d{3}[ -]?\d{3}[ -]?\d{4}\b/);
    expect(code).not.toMatch(/\(\d{3}\)\s?\d{3}/);
  });

  it("holds nothing that only the CV claims", () => {
    for (const forbidden of [
      /\bCV\b/i,
      /résumé|resume\.pdf/i,
      /\$1\.2M/,
      /78,000/,
      /85%/,
      /\b50%/,
      /\b30%/,
    ]) {
      expect(code).not.toMatch(forbidden);
    }
  });

  it("links only to sources that were re-opened for the claims policy", () => {
    const links = [...code.matchAll(/https?:\/\/[^'"\s)]+/g)].map((match) => match[0]);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.startsWith("https://")).toBe(true);
      expect(allowedLinks.has(link), `${link} is not on the allow list`).toBe(true);
    }
  });

  it("dates every source link", () => {
    const sourcedRows = [...code.matchAll(/'link',[^\n]*'(https:\/\/[^']+)', date '(\d{4}-\d{2}-\d{2})'/g)];
    expect(sourcedRows).toHaveLength(8);
  });

  it("seeds no outcome for Stanbic IBTC, Mukuru or uLesson", () => {
    const block = code.slice(code.indexOf("insert into public.outcomes"));
    const outcomes = block.slice(0, block.indexOf(";\n"));
    for (const slug of ["stanbic", "mukuru", "ulesson"]) expect(outcomes).not.toContain(slug);
  });

  it("uses no dash between words", () => {
    expect(code).not.toMatch(
      new RegExp(`[${[0x2013, 0x2014, 0x2015].map((c) => String.fromCharCode(c)).join("")}]`),
    );
    expect(code).not.toMatch(/\S [-] \S/);
  });

  it("holds the six approved home summaries word for word, and the hosted snippet matches", () => {
    const summaries = {
      hbk: "Designing and building the Advantage Insights sensor-data analytics platform and the AI inside it, from Aiana to AI agents, taking features from idea to production.",
      optty:
        "Design and delivery of the integrations behind Optty's payments orchestration platform, connecting merchants to buy now, pay later and local payment methods.",
      "access-bank":
        "Built and shipped QuickBucks and Instant Account, Access Bank's mobile banking products, in a regulated, high-stakes production environment.",
      foresight:
        "A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.",
      fastpilot: "A production RAG system for learning FastAPI: understand, watch, practise.",
      homescout:
        "A home decision workspace for people buying or renting in England, at the research and concept stage.",
    };
    const snippet = readFileSync("supabase/snippets/2026-10-25-home-copy.sql", "utf8");
    const stops = new Set(["hbk", "optty", "access-bank"]);
    for (const [slug, text] of Object.entries(summaries)) {
      const table = stops.has(slug) ? "stops" : "lab_projects";
      const statement = `update public.${table} set summary = '${text.replaceAll("'", "''")}' where slug = '${slug}';`;
      expect(code, `${slug} in the seed`).toContain(statement);
      expect(snippet, `${slug} in the snippet`).toContain(statement);
    }
    expect([...snippet.matchAll(/^update public\.(?:stops|lab_projects) /gm)]).toHaveLength(6);

    // Each outcome statement sets the description the seed inserts for the same stop and figure.
    const statement =
      /^update public\.outcomes set description = '([^']+)' where position = 1 and figure = '([^']+)' and stop_id = \(select id from public\.stops where slug = '([\w-]+)'\);$/gm;
    const outcomeUpdates = [...snippet.matchAll(statement)];
    expect(outcomeUpdates).toHaveLength(3);
    for (const [, description, figure, slug] of outcomeUpdates) {
      const row = `where slug = '${slug}'), null, 1,\n    '${figure}', '${description}',`;
      expect(code, `${slug} outcome`).toContain(row);
    }
  });

  it("starts with only the home flag on", () => {
    const flags = code.slice(
      code.indexOf("insert into public.feature_flags"),
      code.indexOf("on conflict", code.indexOf("feature_flags")),
    );
    expect([...flags.matchAll(/'on'\)/g)]).toHaveLength(1);
    expect(flags).toContain("('page.home', 'on')");
  });
});
