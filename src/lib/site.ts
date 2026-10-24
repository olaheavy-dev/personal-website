// Site settings. The shape matches the rows the Supabase `settings` table will
// hold (#5), and the admin will edit them (#27); until then the values live
// here. An empty (null) value means "not set yet": the UI hides it rather than
// rendering a dead link.

export type ProfileKey = "github" | "linkedin" | "hashnode" | "x";

export type Profile = {
  key: ProfileKey;
  label: string;
  url: string | null;
};

export const site = {
  name: "Sunkanmi Olawuwo",
  firstName: "Sunkanmi",
  url: "https://olaheavy.dev",
  oneLiner: "I take products from idea to production, with AI built in.",
  description:
    "Full-stack & AI engineer in the UK. Designing, building and shipping products end to end, from HBK's sensor-data analytics platform with RAG and AI agents to a decade of banking and payments systems.",
  availability: "Open to senior & staff AI roles · consulting",
  timeZone: "Europe/London",
  timeZoneLabel: "UK",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sunkanmiolawuwo@gmail.com",
  resumeUrl: null as string | null,
  copyrightSince: 2026,
  profiles: [
    { key: "github", label: "GitHub", url: "https://github.com/olaheavy-dev" },
    { key: "linkedin", label: "LinkedIn", url: null },
    { key: "hashnode", label: "Hashnode", url: null },
    { key: "x", label: "X", url: null },
  ] satisfies Profile[] as Profile[],
};

/** Profiles that have a URL set, in display order. */
export function configuredProfiles(profiles: Profile[] = site.profiles): Profile[] {
  return profiles.filter((profile): profile is Profile & { url: string } => Boolean(profile.url));
}
