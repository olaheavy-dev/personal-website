// The /work page's fixed copy, approved by the owner on 27 Oct 2026 (issue #10). One module so
// the page, its metadata and its tests read the same words. Stop summaries and details are
// database content (supabase/migrations/20261027130738_work_copy_content.sql), not here.

export const workCopy = {
  h1: "Work",
  intro: "Seven roles across IoT, banking, cross-border payments, edtech and AI, newest first.",
  metaDescription:
    "Seven roles of production software across banking, cross-border payments, edtech, IoT and AI, from Galooli to HBK.",
  /** Shown when the stops could not be read: before + link + after is the approved sentence. */
  failure: {
    /** The words "the home page" are the link, so the sentence reads the same with or without it. */
    before: "The work list isn't loading right now. The highlights are on ",
    link: "the home page",
    after: ".",
    href: "/",
  },
} as const;
