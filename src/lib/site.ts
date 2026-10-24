// Site-wide settings. These move to the Supabase `settings` table in the
// "Supabase schema + typed data layer" task; until then they live here.
export const site = {
  name: "Sunkanmi Olawuwo",
  firstName: "Sunkanmi",
  url: "https://olaheavy.dev",
  oneLiner: "I take products from idea to production — with AI built in.",
  description:
    "Full-stack & AI engineer in the UK. Designing, building and shipping products end to end — from HBK's sensor-data analytics platform with RAG and AI agents to a decade of banking and payments systems.",
  availability: "Open to senior & staff AI roles · consulting",
  timeZone: "Europe/London",
  timeZoneLabel: "UK",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sunkanmiolawuwo@gmail.com",
} as const;
