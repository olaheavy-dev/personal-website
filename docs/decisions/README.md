# Decision register

Every significant product, technical and working decision gets a record here, named `NNNN-short-title.md`. Hard-to-reverse decisions get a full record; easily reversible choices get one line in the table below with their default.

**Statuses:** Proposed · Accepted · Accepted (partly superseded by NNNN) · Superseded by NNNN · Open (with a revisit point).

| ID                                                        | Decision                                   | Status                               | Date       |
| --------------------------------------------------------- | ------------------------------------------ | ------------------------------------ | ---------- |
| [0001](0001-positioning-and-audience.md)                  | Positioning and audience                   | Accepted                             | 2026-10-24 |
| [0002](0002-nextjs-typescript-pnpm.md)                    | Next.js, TypeScript and pnpm               | Accepted                             | 2026-10-24 |
| [0003](0003-hosting-on-soloforge.md)                      | Hosting on the owner's SoloForge VPS       | Accepted                             | 2026-10-24 |
| [0004](0004-hosted-supabase.md)                           | Hosted Supabase for data, auth and storage | Accepted                             | 2026-10-24 |
| [0005](0005-claims-policy.md)                             | Claims policy                              | Accepted                             | 2026-10-24 |
| [0006](0006-feature-flags-in-supabase.md)                 | Feature flags in Supabase                  | Accepted                             | 2026-10-24 |
| [0007](0007-visual-system.md)                             | Visual system: journey / transit editorial | Accepted                             | 2026-10-24 |
| [0008](0008-writing-via-hashnode.md)                      | Writing via Hashnode                       | Accepted                             | 2026-10-24 |
| [0009](0009-ask-sunkanmi-assistant.md)                    | Ask Sunkanmi assistant                     | Accepted (partly superseded by 0016) | 2026-10-24 |
| [0010](0010-private-source-material.md)                   | Private source material stays local        | Accepted                             | 2026-10-24 |
| [0011](0011-ways-of-working.md)                           | Ways of working                            | Accepted                             | 2026-10-24 |
| [0012](0012-dependencies-and-pre-approved-packages.md)    | Dependencies and pre-approved packages     | Accepted                             | 2026-10-24 |
| [0013](0013-quality-gate.md)                              | Quality gate                               | Accepted                             | 2026-10-24 |
| [0014](0014-no-dashes-between-words.md)                   | No dashes between words                    | Accepted                             | 2026-10-24 |
| [0015](0015-fable-for-highest-stakes-reviews.md)          | Fable 5.1 for the highest-stakes reviews   | Accepted                             | 2026-10-24 |
| [0016](0016-langchain-and-langsmith-for-the-assistant.md) | LangChain and LangSmith for the assistant  | Accepted                             | 2026-10-25 |

## Easily reversible defaults

| Area           | Default                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Licence        | Public, all rights reserved (`LICENSE`)                                                                                                                                |
| Merge method   | Squash only; PR title becomes the commit title                                                                                                                         |
| Theme          | Light by default, follows system, toggle persisted                                                                                                                     |
| Contact email  | Set by `NEXT_PUBLIC_CONTACT_EMAIL`                                                                                                                                     |
| Micro-motions  | Part of the motion system, not delights: they ship without a feature flag and respect reduced motion                                                                   |
| Route layout   | Home stations run vertically on phones and horizontally from the md breakpoint; the `Route` component has no feature flag (it is the signature, not a page or delight) |
| System pages   | The 404 and error pages have no feature flag; they are always on. They add about 6 KB (gzipped) to every page: accepted by the owner, 25 Oct 2026                      |
| Lab demo pages | Developer only pages such as `/_lab/route` exist only when the runtime variable `LAB_PAGES=1` (set by Playwright, never in the image); otherwise a real 404            |
