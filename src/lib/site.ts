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
    "Full-stack & AI engineer based in the UK. Ten years of software across banking, cross-border payments and edtech; today helping build HBK's sensor-data analytics platform and the human-centred AI inside it.",
  availability: "Open to senior & staff AI roles\u00a0· consulting",
  timeZone: "Europe/London",
  timeZoneLabel: "UK",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sunkanmiolawuwo@gmail.com",
  resumeUrl: null as string | null,
  copyrightSince: 2026,
  profiles: [
    { key: "github", label: "GitHub", url: "https://github.com/olaheavy-dev" },
    // Placeholders: each platform's home page until the owner shares the real
    // profile URLs. Set one to null to hide it.
    { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
    { key: "hashnode", label: "Hashnode", url: "https://hashnode.com/" },
    { key: "x", label: "X", url: "https://x.com/" },
  ] satisfies Profile[] as Profile[],
};

/** Profiles that have a URL set, in display order. */
export function configuredProfiles(profiles: Profile[] = site.profiles): Profile[] {
  return profiles.filter((profile): profile is Profile & { url: string } => Boolean(profile.url));
}
