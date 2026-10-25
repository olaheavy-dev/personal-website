// The content tables of the fake Supabase server (stops and lab_projects, each with their
// outcomes), shaped like the PostgREST answers that src/lib/db/queries/* expect for
// `select("*, outcomes(*)")`. Every figure, wording and URL here is copied from
// supabase/seed.sql; scripts/check-fake-content.test.ts proves it, so a fixture can never
// carry a claim the seed does not. The tests only see what the owner has approved.
//
// Modes (set through POST /__control { content }):
//   "ok"     the rows below
//   "empty"  an empty array
//   "error"  HTTP 500, as if Supabase were down

const stamp = "2026-10-25T00:00:00+00:00";

function outcome(owner, fields) {
  return {
    id: `00000000-0000-4000-8000-${String(owner.index).padStart(4, "0")}${String(fields.position).padStart(8, "0")}`,
    case_study_id: null,
    stop_id: owner.stop ?? null,
    lab_project_id: owner.lab ?? null,
    source_note: null,
    created_at: stamp,
    updated_at: stamp,
    ...fields,
  };
}

const stopRow = (index, fields, outcomes = []) => {
  const id = `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  return {
    id,
    created_at: stamp,
    updated_at: stamp,
    status: "published",
    summary: null,
    stack: [],
    end_year: null,
    via: null,
    ...fields,
    outcomes: outcomes.map((o) => outcome({ index, stop: id }, o)),
  };
};

const labRow = (index, fields, outcomes = []) => {
  const id = `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  return {
    id,
    created_at: stamp,
    updated_at: stamp,
    status: "published",
    summary: null,
    demo_url: null,
    writeup_url: null,
    case_study_id: null,
    ...fields,
    outcomes: outcomes.map((o) => outcome({ index: 100 + index, lab: id }, o)),
  };
};

export const stops = [
  stopRow(
    1,
    {
      slug: "galooli",
      number: 1,
      name: "Galooli",
      kind: "compact",
      filters: ["data_iot"],
      start_year: 2016,
      end_year: 2018,
    },
    [
      {
        position: 1,
        figure: "~11%",
        description: "fuel saving across several hundred sites in Nigeria, reported by Galooli",
        source_kind: "link",
        source_label: "Galooli Nigeria case study",
        source_url: "https://galooli.com/case-studies/deep-dive-into-remote-site-energy-use/",
        checked_on: "2026-10-25",
        claim_scope: "company",
        attribution: "Galooli",
        as_of_year: 2021,
      },
    ],
  ),
  stopRow(
    2,
    {
      slug: "access-bank",
      number: 2,
      name: "Access Bank",
      kind: "flagship",
      filters: ["payments"],
      start_year: 2018,
      end_year: 2021,
      summary:
        "Built and shipped QuickBucks and Instant Account, Access Bank's mobile banking products, in a regulated, high-stakes production environment.",
    },
    [
      {
        position: 1,
        figure: "1M+",
        description: "Google Play downloads of the QuickBucks app",
        source_kind: "link",
        source_label: "Google Play listing",
        source_url: "https://play.google.com/store/apps/details?id=com.accessbankplc.quickbucks",
        checked_on: "2026-10-25",
        claim_scope: "company",
        attribution: "Google Play",
        as_of_year: 2026,
      },
    ],
  ),
  stopRow(3, {
    slug: "stanbic-ibtc",
    number: 3,
    name: "Stanbic IBTC",
    kind: "compact",
    filters: ["payments"],
    start_year: 2021,
    end_year: 2022,
  }),
  stopRow(
    4,
    {
      slug: "optty",
      number: 4,
      name: "Optty",
      kind: "flagship",
      filters: ["payments"],
      start_year: 2022,
      end_year: 2024,
      via: "Deimos",
      summary:
        "Design and delivery of the integrations behind Optty's payments orchestration platform, connecting merchants to buy now, pay later and local payment methods.",
    },
    [
      {
        position: 1,
        figure: "90+",
        description: "BNPL and local payment methods across 120+ countries on the Optty platform",
        source_kind: "link",
        source_label: "Optty and Triple-A announcement, 2023",
        source_url:
          "https://triple-a.io/newsroom/optty-partners-with-triple-a-to-expand-payment-architectures-into-digital-currencies",
        checked_on: "2026-10-25",
        claim_scope: "company",
        attribution: "Optty",
        as_of_year: 2023,
      },
    ],
  ),
  stopRow(5, {
    slug: "ulesson",
    number: 5,
    name: "uLesson",
    kind: "compact",
    filters: ["edtech"],
    start_year: 2022,
    end_year: 2024,
    via: "Deimos",
  }),
  stopRow(6, {
    slug: "mukuru",
    number: 6,
    name: "Mukuru",
    kind: "compact",
    filters: ["payments"],
    start_year: 2022,
    end_year: 2024,
    via: "Deimos",
  }),
  stopRow(
    7,
    {
      slug: "hbk",
      number: 7,
      name: "HBK",
      kind: "flagship",
      filters: ["ai", "data_iot"],
      start_year: 2024,
      summary:
        "Designing and building the Advantage Insights sensor-data analytics platform and the AI inside it, from Aiana to AI agents, taking features from idea to production.",
    },
    [
      {
        position: 1,
        figure: "2025 R4",
        description: "Aiana public launch in Advantage Insights",
        source_kind: "link",
        source_label: "HBK Advantage Insights release notes",
        source_url: "https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights",
        checked_on: "2026-10-25",
        claim_scope: "company",
        attribution: "HBK",
        as_of_year: 2025,
      },
    ],
  ),
];

export const labProjects = [
  labRow(
    1,
    {
      slug: "foresight",
      name: "Foresight",
      in_progress: false,
      repo_url: "https://github.com/olaheavy-dev/Foresight",
      live_url: "https://foresight.olaheavy.dev",
      video_url: null,
      links_checked_on: "2026-10-25",
      position: 1,
      summary:
        "A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.",
    },
    [
      {
        position: 1,
        figure: "17",
        description: "evaluation suites",
        source_kind: "link",
        source_label: "Foresight repository README",
        source_url: "https://github.com/olaheavy-dev/Foresight",
        checked_on: "2026-10-25",
        claim_scope: "personal",
        attribution: null,
        as_of_year: null,
      },
    ],
  ),
  labRow(
    2,
    {
      slug: "fastpilot",
      name: "FastPilot",
      in_progress: false,
      repo_url: "https://github.com/olaheavy-dev/fastpilot",
      live_url: null,
      video_url: "https://www.loom.com/share/a1d6bf3ee7c54e5c93de4ac8c280992f",
      links_checked_on: "2026-10-25",
      position: 2,
      summary: "A production RAG system for learning FastAPI: understand, watch, practise.",
    },
    [
      {
        position: 1,
        figure: "0.992",
        description: "answer faithfulness, scored by an LLM judge in production",
        source_kind: "link",
        source_label: "FastPilot repository README",
        source_url: "https://github.com/olaheavy-dev/fastpilot",
        checked_on: "2026-10-25",
        claim_scope: "personal",
        attribution: null,
        as_of_year: null,
      },
    ],
  ),
  labRow(3, {
    slug: "homescout",
    name: "HomeScout",
    in_progress: true,
    repo_url: "https://github.com/olaheavy-dev/homescout-platform",
    live_url: null,
    video_url: null,
    links_checked_on: "2026-10-25",
    position: 3,
    summary:
      "A home decision workspace for people buying or renting in England, at the research and concept stage.",
  }),
  labRow(4, {
    slug: "sabitutor",
    name: "SabiTutor",
    in_progress: true,
    repo_url: null,
    live_url: null,
    video_url: null,
    links_checked_on: null,
    position: 4,
  }),
];

/**
 * The answer for a content table, or null when the path is not one. `table` is the path after
 * /rest/v1/. Like the real public role, only published rows come back.
 */
export function contentAnswer(table, mode) {
  const rows = table === "stops" ? stops : table === "lab_projects" ? labProjects : null;
  if (!rows) return null;
  if (mode === "error") return { status: 500, body: { message: "fake outage" } };
  if (mode === "empty") return { status: 200, body: [] };
  return { status: 200, body: rows.filter((row) => row.status === "published") };
}
