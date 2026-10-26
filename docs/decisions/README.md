# Decision register

Every significant product, technical and working decision gets a record here, named `NNNN-short-title.md`. Hard-to-reverse decisions get a full record; easily reversible choices get one line in the table below with their default.

**Statuses:** Proposed · Accepted · Accepted (partly superseded by NNNN) · Superseded by NNNN · Open (with a revisit point).

| ID                                                        | Decision                                      | Status                               | Date       |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------ | ---------- |
| [0001](0001-positioning-and-audience.md)                  | Positioning and audience                      | Accepted                             | 2026-10-24 |
| [0002](0002-nextjs-typescript-pnpm.md)                    | Next.js, TypeScript and pnpm                  | Accepted                             | 2026-10-24 |
| [0003](0003-hosting-on-soloforge.md)                      | Hosting on the owner's SoloForge VPS          | Accepted                             | 2026-10-24 |
| [0004](0004-hosted-supabase.md)                           | Hosted Supabase for data, auth and storage    | Accepted                             | 2026-10-24 |
| [0005](0005-claims-policy.md)                             | Claims policy                                 | Accepted                             | 2026-10-24 |
| [0006](0006-feature-flags-in-supabase.md)                 | Feature flags in Supabase                     | Accepted                             | 2026-10-24 |
| [0007](0007-visual-system.md)                             | Visual system: journey / transit editorial    | Accepted                             | 2026-10-24 |
| [0008](0008-writing-via-hashnode.md)                      | Writing via Hashnode                          | Accepted                             | 2026-10-24 |
| [0009](0009-ask-sunkanmi-assistant.md)                    | Ask Sunkanmi assistant                        | Accepted (partly superseded by 0016) | 2026-10-24 |
| [0010](0010-private-source-material.md)                   | Private source material stays local           | Accepted                             | 2026-10-24 |
| [0011](0011-ways-of-working.md)                           | Ways of working                               | Accepted                             | 2026-10-24 |
| [0012](0012-dependencies-and-pre-approved-packages.md)    | Dependencies and pre-approved packages        | Accepted                             | 2026-10-24 |
| [0013](0013-quality-gate.md)                              | Quality gate                                  | Accepted                             | 2026-10-24 |
| [0014](0014-no-dashes-between-words.md)                   | No dashes between words                       | Accepted                             | 2026-10-24 |
| [0015](0015-fable-for-highest-stakes-reviews.md)          | Fable 5.1 for the highest-stakes reviews      | Accepted                             | 2026-10-24 |
| [0016](0016-langchain-and-langsmith-for-the-assistant.md) | LangChain and LangSmith for the assistant     | Accepted                             | 2026-10-25 |
| [0017](0017-content-security-policy.md)                   | Content Security Policy and security headers  | Accepted                             | 2026-10-25 |
| [0018](0018-how-flags-reach-prerendered-pages.md)         | How feature flags reach prerendered pages     | Accepted                             | 2026-10-25 |
| [0019](0019-migrations-apply-on-merge.md)                 | Content ships as migrations, applied on merge | Accepted                             | 2026-10-26 |

## Easily reversible defaults

| Area             | Default                                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Licence          | Public, all rights reserved (`LICENSE`)                                                                                                                                                                                                 |
| Merge method     | Squash only; PR title becomes the commit title                                                                                                                                                                                          |
| Theme            | Light by default, follows system, toggle persisted                                                                                                                                                                                      |
| Contact email    | Set by `NEXT_PUBLIC_CONTACT_EMAIL`                                                                                                                                                                                                      |
| Micro-motions    | Part of the motion system, not delights: they ship without a feature flag and respect reduced motion                                                                                                                                    |
| Route layout     | Home stations run vertically on phones and horizontally from the md breakpoint; the `Route` component has no feature flag (it is the signature, not a page or delight)                                                                  |
| System pages     | The 404 and error pages have no feature flag; they are always on. They add about 6 KB (gzipped) to every page: accepted by the owner, 25 Oct 2026                                                                                       |
| Lab demo pages   | Developer only pages such as `/_lab/route` exist only when the runtime variable `LAB_PAGES=1` (set by Playwright, never in the image); otherwise a real 404                                                                             |
| Work filters     | Four chips: All, AI, Payments & banking, Data & IoT, Edtech (`?filter=ai\|payments\|data-iot\|edtech`) (issue #5, 25 Oct 2026)                                                                                                          |
| Lab cards        | Show evidence (GitHub, demo, write-up) and "Try it" only while a live URL is set; a small "In progress" tag; no Live or Coming soon badges. Stored as `in_progress boolean` (issue #5)                                                  |
| uLesson          | No figures, like Stanbic IBTC (issue #5, supersedes the two figures in the earlier brief)                                                                                                                                               |
| Database tooling | Supabase CLI with a local Docker Postgres, pgTAP tests, generated types checked in CI; the hosted project is changed only by migrations, which the Publish image workflow applies on merge (decision 0019) (issue #5, docs/database.md) |
| Seeding          | `supabase/seed.sql` is idempotent: settings and flags are never overwritten on a re-run                                                                                                                                                 |
| Flag cache       | `getFlags()` is cached for an hour (`cacheLife("hours")`) as a backstop; the Supabase webhook refreshes it at once (decision 0018, issue #6)                                                                                            |
| Preview flag     | Preview behaves as Off for everyone until Auth (#23) can tell the owner apart; the Preview banner moves to the admin shell task (decision 0018)                                                                                         |
