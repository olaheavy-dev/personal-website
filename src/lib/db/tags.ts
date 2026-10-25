// Cache tags for the typed queries. A tag names a group of cached reads; the admin
// (#27) and the publish webhooks call `revalidateTag` with these to refresh them.

export const tags = {
  settings: "settings",
  flags: "flags",
  stops: "stops",
  caseStudies: "case-studies",
  caseStudy: (slug: string) => `case-study:${slug}`,
  lab: "lab",
  travel: "travel",
} as const;
