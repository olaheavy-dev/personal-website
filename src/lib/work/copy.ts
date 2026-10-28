// The /work page's fixed copy, approved by the owner on 27 Oct 2026 (issue #10). One module so
// the page, its metadata and its tests read the same words. Stop summaries and details are
// database content (supabase/migrations/20261027130738_work_copy_content.sql), not here.

export const workCopy = {
  h1: "Work",
  intro:
    "Where I have worked, newest first: AI and sensor-data analytics, cross-border payments, edtech, banking and IoT.",
  metaDescription:
    "Where I have worked, from Galooli to HBK: AI and sensor-data analytics, cross-border payments, edtech, banking and IoT.",
  /** Shown when the stops could not be read: before + link + after is the approved sentence. */
  failure: {
    /** The words "the home page" are the link, so the sentence reads the same with or without it. */
    before: "The work list isn't loading right now. The highlights are on ",
    link: "the home page",
    after: ".",
    href: "/",
  },
} as const;
