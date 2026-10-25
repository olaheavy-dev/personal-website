# Feature flags

Every public page and every optional feature sits behind a flag (decision 0006). This page lists all of them, says what each one does, and how to switch them. How a change reaches the prerendered site is decision 0018; the technical detail is in [database.md](database.md#feature-flags).

## The three states

| State     | Public visitors    | Navigation, sitemap, ⌘K, assistant citations |
| --------- | ------------------ | -------------------------------------------- |
| `on`      | Visible            | Listed                                       |
| `preview` | A "Wrong turn" 404 | Hidden                                       |
| `off`     | A "Wrong turn" 404 | Hidden                                       |

`preview` is meant to show a page to the owner only, with a "Preview" banner. Until sign in exists (#23) the site cannot tell the owner apart, so **`preview` behaves exactly like `off`** for everyone.

A hidden page answers status 404 with the "Wrong turn" title and never shows its own title. It disappears from the navigation, the mobile menu, the 404's way back and `sitemap.xml` at the same time.

## Every flag

State as set on the hosted project, 25 Oct 2026. Staging and production share one Supabase project, so they share one set of flags.

| Flag                | Controls                                            | State | In effect now?                                              |
| ------------------- | --------------------------------------------------- | ----- | ----------------------------------------------------------- |
| `page.home`         | The home page `/`                                   | `on`  | Locked on: the database refuses any other state or a delete |
| `page.work`         | `/work` and its nav item                            | `on`  | Yes                                                         |
| `page.lab`          | `/lab` and its nav item                             | `on`  | Yes                                                         |
| `page.writing`      | `/writing` and its nav item                         | `on`  | Yes                                                         |
| `page.travel`       | `/travel` and its nav item                          | `on`  | Yes                                                         |
| `page.about`        | `/about` and its nav item                           | `on`  | Yes                                                         |
| `case.hbk-aiana`    | The HBK Aiana case study                            | `off` | No: the case study page does not exist yet (#11)            |
| `case.optty`        | The Optty case study                                | `off` | No: not built yet (#12)                                     |
| `case.access-bank`  | The Access Bank case study                          | `off` | No: not built yet (#12)                                     |
| `case.foresight`    | The Foresight case study                            | `off` | No: not built yet (#12)                                     |
| `feature.assistant` | The Ask Sunkanmi launcher and panel                 | `off` | No: not built yet (#18, #19)                                |
| `feature.passport`  | Passport stamps and the footer indicator            | `off` | No: not built yet (#21)                                     |
| `feature.cmdk`      | The ⌘K palette and its hint on the 404              | `off` | No: not built yet (#20)                                     |
| `feature.globe3d`   | The 3D travel globe (off: the 2D map and list only) | `off` | No: not built yet (#17)                                     |

The five pages are `on` so staging looks complete while they show their "Coming soon" screens. Decide at production launch which stay visible.

## How to switch a flag (today)

1. Open the Supabase dashboard for project `qixsdwyfuewbhxbcaufl`, then **Table Editor, `feature_flags`**.
2. Change the `state` of the row to `on`, `preview` or `off` and save.
3. Within a few seconds the site follows: a Database Webhook (`revalidate_flags`) tells the site to refresh, and the next visitor sees the change. Checked on staging on 25 Oct 2026 by switching `page.lab` off and on.

The same change in the SQL editor: `update public.feature_flags set state = 'off' where key = 'page.lab';`

If the webhook call is ever lost, the site catches up within an hour by itself. To refresh at once, see step 5 in [database.md](database.md#feature-flags).

**Things to know**

- `page.home` cannot be changed or deleted; the database refuses it.
- A flag key that does not exist reads as `off`. Keys follow `page.<name>`, `case.<slug>` or `feature.<name>`, lowercase with hyphens; the database refuses anything else.
- Flags for features that are not built yet do nothing until that feature ships. Switching them on early is harmless.
- If Supabase is down, a running site keeps showing the last flags it read successfully and retries every minute. The exception: a server that has just started (a new deploy, a restart, or a rollback to an image built more than a day ago) and has never read the flags yet answers 500 on every page until Supabase is back (decision 0018).
- Never run `supabase db pull` or share a schema dump: the webhook's secret would be included (see [database.md](database.md#feature-flags)).

## Adding a flag

A new page or feature gets its flag in the same pull request: a row in `supabase/seed.sql` (seeded `off`), a line in this table, and, for a page, an entry in `src/lib/flags/registry.ts` with `gatePage()` in the page. On the hosted project, add the row once in the Table Editor (the seed only runs on the first push).

## Later: the admin panel

Switching flags moves into the admin at `/admin/flags` (#27, "Admin flags, writing sync, assistant"), after the admin sign in with MFA exists (#23). It will show this table with On, Preview and Off controls and a summary of what each change affects, and `preview` will start showing pages to the signed in owner with a banner. Until then, use the Table Editor as above.
