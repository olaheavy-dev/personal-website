# Decision register

Every significant product, technical and working decision gets a record here, named `NNNN-short-title.md`. Hard-to-reverse decisions get a full record; easily reversible choices get one line in the table below with their default.

**Statuses:** Proposed · Accepted · Accepted (partly superseded by NNNN) · Superseded by NNNN · Open (with a revisit point).

| ID                                                     | Decision                                   | Status   | Date       |
| ------------------------------------------------------ | ------------------------------------------ | -------- | ---------- |
| [0001](0001-positioning-and-audience.md)               | Positioning and audience                   | Accepted | 2026-10-24 |
| [0002](0002-nextjs-typescript-pnpm.md)                 | Next.js, TypeScript and pnpm               | Accepted | 2026-10-24 |
| [0003](0003-hosting-on-soloforge.md)                   | Hosting on the owner's SoloForge VPS       | Accepted | 2026-10-24 |
| [0004](0004-hosted-supabase.md)                        | Hosted Supabase for data, auth and storage | Accepted | 2026-10-24 |
| [0005](0005-claims-policy.md)                          | Claims policy                              | Accepted | 2026-10-24 |
| [0006](0006-feature-flags-in-supabase.md)              | Feature flags in Supabase                  | Accepted | 2026-10-24 |
| [0007](0007-visual-system.md)                          | Visual system: journey / transit editorial | Accepted | 2026-10-24 |
| [0008](0008-writing-via-hashnode.md)                   | Writing via Hashnode                       | Accepted | 2026-10-24 |
| [0009](0009-ask-sunkanmi-assistant.md)                 | Ask Sunkanmi assistant                     | Accepted | 2026-10-24 |
| [0010](0010-private-source-material.md)                | Private source material stays local        | Accepted | 2026-10-24 |
| [0011](0011-ways-of-working.md)                        | Ways of working                            | Accepted | 2026-10-24 |
| [0012](0012-dependencies-and-pre-approved-packages.md) | Dependencies and pre-approved packages     | Accepted | 2026-10-24 |
| [0013](0013-quality-gate.md)                           | Quality gate                               | Accepted | 2026-10-24 |
| [0014](0014-no-dashes-between-words.md)                | No dashes between words                    | Accepted | 2026-10-24 |

## Easily reversible defaults

| Area          | Default                                            |
| ------------- | -------------------------------------------------- |
| Licence       | Public, all rights reserved (`LICENSE`)            |
| Merge method  | Squash only; PR title becomes the commit title     |
| Theme         | Light by default, follows system, toggle persisted |
| Contact email | Set by `NEXT_PUBLIC_CONTACT_EMAIL`                 |
