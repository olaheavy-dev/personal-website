import { existsSync, readFileSync } from "node:fs";

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
  "https://techzim.co.zw/2025/03/20years-mukuru-milestones-that-shaped-journey",
  "https://galooli.com/case-studies/deep-dive-into-remote-site-energy-use/",
  "https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights",
  "https://investorrelations.accessbankplc.com/Personal-Banking/LOANS/Device-Finance.aspx",
  "https://brandcom.ng/2023/05/24/access-bank-konga-partner-to-provide-installment-payments-through-pay-with-quickbucks/",
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
    expect(sourcedRows).toHaveLength(9);
  });

  it("seeds no outcome for Stanbic IBTC or uLesson", () => {
    const block = code.slice(code.indexOf("insert into public.outcomes"));
    const outcomes = block.slice(0, block.indexOf(";\n"));
    for (const slug of ["stanbic", "ulesson"]) expect(outcomes).not.toContain(slug);
  });

  it("uses no dash between words", () => {
    expect(code).not.toMatch(
      new RegExp(`[${[0x2013, 0x2014, 0x2015].map((c) => String.fromCharCode(c)).join("")}]`),
    );
    expect(code).not.toMatch(/\S [-] \S/);
  });

  it("holds the five approved home summaries word for word, and the hosted snippet matches", () => {
    const summaries = {
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
    const stops = new Set(["optty", "access-bank"]);
    for (const [slug, text] of Object.entries(summaries)) {
      const table = stops.has(slug) ? "stops" : "lab_projects";
      const statement = `update public.${table} set summary = '${text.replaceAll("'", "''")}' where slug = '${slug}';`;
      expect(code, `${slug} in the seed`).toContain(statement);
      expect(snippet, `${slug} in the snippet`).toContain(statement);
    }
    expect([...snippet.matchAll(/^update public\.(?:stops|lab_projects) /gm)]).toHaveLength(5);

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

  it("holds the 26 Oct summaries and the Mukuru figure word for word, and the content migration matches", () => {
    const summaries = {
      hbk: "Designing and building HBK's sensor-data analytics platform for test, durability and fatigue engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like Python code suggestions and file data analysis.",
      mukuru:
        "Integrations that land Mukuru's cross-border transfers in Malawian mobile money wallets, with USSD payment flows built to handle errors and retries.",
    };
    const migration = readFileSync("supabase/migrations/20261026132128_selected_stops_content.sql", "utf8");
    for (const [slug, text] of Object.entries(summaries)) {
      const statement = `update public.stops set summary = '${text.replaceAll("'", "''")}' where slug = '${slug}';`;
      expect(code, `${slug} in the seed`).toContain(statement);
      expect(migration, `${slug} in the migration`).toContain(statement);
    }
    const row = `where slug = 'mukuru'), null, 1,
    '17M+', 'customers served',
    'link', 'Techzim, 20 years of Mukuru', 'https://techzim.co.zw/2025/03/20years-mukuru-milestones-that-shaped-journey', date '2026-10-26',
    'company', 'Mukuru', 2025)`;
    expect(code).toContain(row);

    // The migration inserts the same row through "insert ... select": its value lines must be
    // the seed row's lines.
    const valueLines = row
      .split("\n")
      .slice(1)
      .map((line) => line.trim().replace(/\)$/, ""));
    expect(valueLines).toHaveLength(3);
    for (const line of valueLines) expect(migration, line).toContain(line);
    // Position 1 and no lab project, as in the seed row.
    expect(migration).toContain("id, null, 1,");
    expect(migration).toContain("from public.stops where slug = 'mukuru';");
    expect(migration).toContain(
      "delete from public.outcomes where stop_id = (select id from public.stops where slug = 'mukuru');",
    );
  });

  it("holds the seven CV roles word for word, and the roles migration matches", () => {
    const roles = {
      galooli: "Technical Support Engineer",
      "access-bank": "Senior Software Engineer",
      "stanbic-ibtc": "Senior Solutions Developer",
      optty: "Senior Software Engineer",
      ulesson: "Senior Software Engineer",
      mukuru: "Senior Software Engineer",
      hbk: "Backend Software Engineer",
    };
    const migrationFile = "supabase/migrations/20261027115039_stops_role_content.sql";
    expect(existsSync(migrationFile), `${migrationFile} must exist (renamed? update this path)`).toBe(true);
    const migration = readFileSync(migrationFile, "utf8");
    for (const [slug, text] of Object.entries(roles)) {
      const statement = `update public.stops set role = '${text}' where slug = '${slug}';`;
      expect(code, `${slug} in the seed`).toContain(statement);
      expect(migration, `${slug} in the migration`).toContain(statement);
    }
    expect([...migration.matchAll(/^update public\.stops set role = /gm)]).toHaveLength(7);
  });

  it("holds the 27 Oct Work copy word for word, and the Work copy migration matches", () => {
    const summaries = {
      galooli:
        "Field deployment and support of Galooli's IoT energy management for telecom tower sites across Nigeria.",
      "stanbic-ibtc":
        "Digital banking products in Stanbic IBTC's Innovation Lab, built on open banking APIs with fintech partners.",
      ulesson:
        "Web platform work for uLesson's learning app: a redesign, faster pages and better observability.",
    };
    const details = {
      galooli: [
        "Deployed IoT energy management for telecom tower operators across Nigeria.",
        "Delivered the analytics dashboards clients used to track energy use and running costs.",
      ],
      "stanbic-ibtc": [
        "Redesigned the Personal Finance Manager across web and mobile, with better accessibility and deeper links to digital banking APIs.",
        "Added retries and background processing to EZ Cash so fewer transactions failed.",
        "Turned business ideas into secure digital products alongside product and business teams.",
        "Mentored junior engineers on the team.",
      ],
      ulesson: [
        "Redesigned the uLesson web platform so pages load faster and learning flows read more clearly.",
        "Built observability and logging that made production problems quicker to find and fix.",
        "Improved the front end and back end across learning workflows and platform reliability.",
      ],
      mukuru: [
        "Integrated mobile wallet providers and Malawi's national payment switch so remittances reach wallets.",
        "Added value-added services for remittance customers alongside transfers.",
      ],
    };
    const migrationFile = "supabase/migrations/20261027130738_work_copy_content.sql";
    expect(existsSync(migrationFile), `${migrationFile} must exist (renamed? update this path)`).toBe(true);
    const migration = readFileSync(migrationFile, "utf8");
    const sql = (text: string) => `'${text.replaceAll("'", "''")}'`;
    const statements: string[] = [];
    for (const [slug, text] of Object.entries(summaries)) {
      statements.push(`update public.stops set summary = ${sql(text)} where slug = '${slug}';`);
    }
    for (const [slug, lines] of Object.entries(details)) {
      expect(lines.length).toBeLessThanOrEqual(4);
      statements.push(
        `update public.stops set details = array[${lines.map(sql).join(", ")}] where slug = '${slug}';`,
      );
    }
    for (const statement of statements) {
      expect(code, statement).toContain(statement);
      expect(migration, statement).toContain(statement);
    }
    expect([...migration.matchAll(/^update public\.stops set (?:summary|details) = /gm)]).toHaveLength(7);

    // Galooli's figure keeps its source and credit, and no longer says "reported by Galooli".
    const outcome = `update public.outcomes set description = 'fuel saving across several hundred sites in Nigeria' where position = 1 and stop_id = (select id from public.stops where slug = 'galooli');`;
    expect(migration).toContain(outcome);
    expect(code).toContain(
      "'~11%', 'fuel saving across several hundred sites in Nigeria',\n    'link', 'Galooli Nigeria case study', 'https://galooli.com/case-studies/deep-dive-into-remote-site-energy-use/', date '2026-10-25',\n    'company', 'Galooli', 2021)",
    );
    expect(code).not.toContain("reported by Galooli");
  });

  it("holds the 27 Oct flagship details and Access Bank sources word for word, and the details migration matches", () => {
    const details = {
      hbk: [
        "Built an evaluation workflow that turned AI quality questions into evidence-based decisions, and helped other teams set up their own.",
      ],
      optty: [
        "Built the API integrations that connect Optty's merchants to buy now, pay later providers and alternative payment methods.",
        "Designed transaction tokenisation to keep payment data secure across multiple gateways.",
        "Helped build configurable user experiences and reporting tools that gave the team clearer operational visibility.",
      ],
      "access-bank": [
        "Built QuickBucks, Access Bank's digital lending app for web and mobile, including Device Finance, which lets salaried customers buy a smartphone over 12 months.",
        "Built the Device Finance vendor portal, where device partners managed their devices, customers, pickups and integrations.",
        "Built the Instant Account Opening portal, automating onboarding with the Nigeria Inter-Bank Settlement System, identity verification and KYC checks.",
        "Access Bank later extended QuickBucks to instalment checkout on Konga (2023).",
      ],
    };
    const sources =
      '[{"label": "Device Finance FAQ", "url": "https://investorrelations.accessbankplc.com/Personal-Banking/LOANS/Device-Finance.aspx"}, {"label": "Konga partnership", "url": "https://brandcom.ng/2023/05/24/access-bank-konga-partner-to-provide-installment-payments-through-pay-with-quickbucks/"}]';
    const migrationFile = "supabase/migrations/20261027163838_ticket_details_content.sql";
    expect(existsSync(migrationFile), `${migrationFile} must exist (renamed? update this path)`).toBe(true);
    const migration = readFileSync(migrationFile, "utf8");
    const sql = (text: string) => `'${text.replaceAll("'", "''")}'`;
    const statements = Object.entries(details).map(([slug, lines]) => {
      expect(lines.length).toBeLessThanOrEqual(4);
      return `update public.stops set details = array[${lines.map(sql).join(", ")}] where slug = '${slug}';`;
    });
    statements.push(
      `update public.stops set detail_sources = '${sources}'::jsonb where slug = 'access-bank';`,
    );
    for (const statement of statements) {
      expect(code, statement).toContain(statement);
      expect(migration, statement).toContain(statement);
    }
    expect([...migration.matchAll(/^update public\.stops set /gm)]).toHaveLength(4);
    // HBK's evaluation work is described by outcome only: no internal tool name.
    expect(migration).not.toMatch(/raglab|ragas|langsmith/i);
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
