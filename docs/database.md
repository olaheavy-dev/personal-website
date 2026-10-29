# Database

The site's content, flags and travel data live in hosted Supabase (decision 0004): Postgres with pgvector. The schema, the seed and the tests are in `supabase/`; the typed data layer is in `src/lib/db/`. Nothing in the repository holds a secret.

## How it fits together

| Piece                          | What it is                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/*.sql`    | The schema (extensions and enums, tables and constraints, grants and row level security) and, until the admin ships, content changes (decision 0019). Applied to the hosted project when a change merges |
| `supabase/seed.sql`            | The first content, from the claims policy only (decision 0005). Safe to run again                                                                                                                        |
| `supabase/snippets/*.sql`      | Older one off statements pasted into the hosted SQL editor by hand. New content changes are migrations instead (decision 0019)                                                                           |
| `supabase/tests/*.test.sql`    | pgTAP tests of the rules above (`make db-test`)                                                                                                                                                          |
| `src/lib/db/database.types.ts` | Types generated from the schema (`make db-types`). Never edit by hand                                                                                                                                    |
| `src/lib/db/queries/*`         | Typed, cached reads for the pages                                                                                                                                                                        |
| `src/lib/db/admin.ts`          | The secret key client for the server (admin and webhooks later). ESLint limits who may import it                                                                                                         |

## Keys

Only the new Supabase keys are supported. The code refuses the legacy `anon` and `service_role` keys.

| Variable                               | Where              | Notes                                                          |
| -------------------------------------- | ------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser and server | `https://<project-ref>.supabase.co`                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Starts `sb_publishable_`. Safe to publish; RLS guards the data |
| `SUPABASE_SECRET_KEY`                  | Server only        | Starts `sb_secret_`. Bypasses RLS. Never `NEXT_PUBLIC_`        |

`make check` runs `scripts/check-client-secrets.mjs`, which fails if the browser bundle contains the secret key or its variable name, if a `NEXT_PUBLIC_` variable carries a secret, or if a client component imports `src/lib/db/admin.ts`.

## Tables

| Table                          | Holds                                                                                                                                                                              | Public read                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `settings`                     | Name, one liner, availability, time zone, social links (key and JSON value)                                                                                                        | All rows                          |
| `feature_flags`                | `page.*`, `case.*`, `feature.*` with state on, preview or off. `page.home` is locked on                                                                                            | Rows that are `on`                |
| `stops`                        | Jobs and engagements, numbered 01 to 07, with role, years, up to four `details` lines with optional public `detail_sources`, and the Work areas (`filters`, shown as small labels) | Published                         |
| `case_studies`                 | Long write-ups, TL;DR bullets. Publishing needs 1 to 4 bullets and at least 3 sourced outcomes                                                                                     | Published                         |
| `case_study_sections`          | The seven fixed sections (`context` to `reflection`)                                                                                                                               | With a published case study       |
| `outcomes`                     | Figures with their source. One parent (stop, case study or lab project)                                                                                                            | With a published parent           |
| `lab_projects`                 | Personal projects, evidence links, `in_progress`. `raglab` is refused                                                                                                              | Published                         |
| `media`                        | Images and video. Alt text needed to publish; AI generated images need a caption                                                                                                   | Published                         |
| `countries`, `trips`, `photos` | Travel. One home country. Photos carry no coordinates                                                                                                                              | Published, with published parents |
| `posts_cache`                  | Hashnode posts cached for Writing                                                                                                                                                  | Published                         |
| `kb_chunks`                    | Assistant knowledge: `vector(1024)` embeddings (HNSW cosine), generated `fts` (GIN)                                                                                                | Never (server only)               |
| `assistant_evals`              | Questions the assistant is scored against                                                                                                                                          | Never (server only)               |

### The claims policy in constraints

The database refuses what the claims policy forbids, so a mistake in the admin cannot reach the site.

- An outcome has exactly one parent.
- A `link` source needs an `https://` URL, a label, the day it was last checked (`checked_on`) and no note. An `own` source needs a note and no URL.
- A link source may carry a `source_phrase`, a Wayback `source_archive_url` and a `source_broken_on` day for the weekly source link checker; an own measurement carries none, and a broken day needs an archive address (`docs/source-links.md`).
- A `company` claim needs an `attribution` and an `as_of_year`.
- Lab links must start with `https://`. The slug and name `raglab` are refused.

### Access model (RLS)

- Row level security is on for every table.
- `anon` and `authenticated` hold `select` on the public tables only, and the policies show published rows only. Nobody but the secret key can write. A write by anyone else fails with error `42501`.
- All privileges are revoked from `anon` and `authenticated`, and the default privileges are revoked too, so **a table you add later starts closed**. To open one, add a `grant select ... to anon, authenticated` and a policy in the same migration, and a test.
- Every function sets `search_path = ''` and is not executable by the public roles.

## Local database (needs Docker)

```sh
make db-check      # start, reset, test, lint, and check the generated types
make db-stop       # stop the containers when you are done
```

The parts, if you want one step: `make db-start` (Postgres only), `make db-reset` (migrations then seed), `make db-test` (pgTAP), `make db-lint`, `make db-types` (rewrites `src/lib/db/database.types.ts`).

`config.toml` turns off sign-ups, Studio and the services the site does not use. To try the API locally as well, run `pnpm exec supabase start` (everything), then `pnpm exec supabase status -o env` for the local URL and keys.

CI runs `make db-check` in the `database` job, with Postgres only.

### Changing the schema

1. `pnpm exec supabase migration new short_name`, then write the SQL. Migrations are never edited after they have been merged; fix a mistake with a new migration.
2. Add or update the tests in `supabase/tests/`.
3. `make db-check`; commit the regenerated `database.types.ts`.
4. Merge. The **Publish image** workflow applies the pending migration to the hosted project before it builds the image (below). Nothing to run by hand.

**Migration timestamps must increase.** `supabase db push` (CLI 2.122.0) refuses to run when a local migration is older than the newest one already applied to the hosted project, which would block every publish. Create migrations with `migration new` on a branch that is up to date with `main`. The `database` job runs `make migration-order` (`scripts/check-migration-order.mjs`), which fetches the tip of `main` and fails when a file your branch adds is not newer than every migration on `main`. If two branches race and yours loses, rename your migration file to a newer timestamp (`git mv`): that is safe because the hosted history never recorded it, so only a migration that has already been applied must keep its name.

**Keep each migration backwards compatible with the running image.** The old image keeps serving for the minutes between the migration and the deploy. Add a column, table or enum value before any code uses it; remove or rename something only in a later migration, after the code has stopped reading it.

### When the migrate job fails

Open the failed **Publish image** run: nothing was built or published, and the site is still on the previous image. Then:

- **A migration failed partway, or the history disagrees with the files.** `pnpm exec supabase link --project-ref qixsdwyfuewbhxbcaufl`, then `pnpm exec supabase migration list` shows local and remote side by side. If a migration is recorded but should not be, `pnpm exec supabase migration repair --status reverted <version>`; if it was applied by hand and is missing from the history, `pnpm exec supabase migration repair --status applied <version>`. Fix the cause on a branch (a failed migration that was never recorded is fixed in place; one that was applied is fixed by a new migration), merge it, and the next run applies it.
- **The environment, a secret or the variable is missing or wrong.** Fix it in GitHub (`docs/deploy.md`, Owner setup), then re-run the failed **Publish image** run. It publishes only if `main` still points at the commit CI checked; if `main` has moved on, the run fails on purpose and the next merge publishes instead.
- **Out of order** (`supabase db push` reports a remote migration missing locally, or a local migration older than the newest remote one). The CI check normally stops this. Rename the never applied file to a newer timestamp as above and merge.

### Changing content (until the admin ships)

Content changes are migrations too (decision 0019), because the seed does not re-run on a hosted project:

1. Write the migration so it can run twice and on a fresh database: `update ... where slug = '...'`, and for outcomes `delete from public.outcomes where stop_id = (select id from public.stops where slug = '...')` then `insert ... select ... from public.stops where slug = '...'`, which inserts nothing when the stop does not exist yet.
2. Put the same values in `supabase/seed.sql`, so a local reset gives the same content.
3. Add the new values to the word for word check in `scripts/check-seed.test.ts`. The pgTAP tests `supabase/tests/content_migration.test.sql` (26 Oct) and `supabase/tests/stops_role_migration.test.sql` (27 Oct roles) and `supabase/tests/work_copy_migration.test.sql` (27 Oct Work copy) and `supabase/tests/ticket_details_migration.test.sql` (27 Oct flagship details) replay a content migration on seeded data and check nothing changes; a new content migration needs the same replay (copy that test with the migration's name).

A content migration that deletes and re-inserts a stop's outcomes starts those rows with no `source_phrase`, `source_archive_url` or `source_broken_on`: set them again in the insert (or use `update`), or the weekly source link checker loses the phrase and archive copy (`docs/source-links.md`).

When the admin (#26, #27) ships, content migrations stop: content is edited in the admin, and migrations are for structure only.

## Pushing to the hosted project

**Normally you do nothing.** When a change merges to `main` and CI passes, the `migrate` job in `.github/workflows/publish.yml` runs before the image is built: `supabase link`, then `supabase db push --dry-run` (the log lists what is pending), then `supabase db push` with no `--include-seed`. The image build waits for it, so the prerendered pages read the new data, and a failed migration stops the publish. It uses the `supabase-production` environment (`docs/deploy.md`, Owner setup).

The project is `qixsdwyfuewbhxbcaufl` (London, Free plan). The agent never has its keys or its database password.

The first push of a brand new project, and any repair, is still done by the owner by hand:

```sh
pnpm install
pnpm exec supabase login
pnpm exec supabase link --project-ref qixsdwyfuewbhxbcaufl   # type the database password
pnpm exec supabase db push --include-seed --dry-run          # shows what would run
pnpm exec supabase db push --include-seed                    # applies the migrations, then the seed
```

### What the seed does

`supabase/seed.sql` is for the **first push** and for a local `db reset`. With CLI 2.122.0, `db push --include-seed` runs the seed statements only the first time. If the file has changed since, the CLI only refreshes its stored hash and **skips the statements**, so editing the seed does not change the hosted data.

What a run does to a database that already has data:

| Data                                                                                                                                                               | A re-run                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `settings`, `feature_flags`                                                                                                                                        | Inserts missing rows only. Never overwrites an edit    |
| `stops` (including `summary`), `case_studies` (title and stop link), `case_study_sections` (title and position), `lab_projects` (including `summary`), `countries` | **Overwrites** the seeded columns with the seed values |
| `outcomes` for the seeded stops and lab projects (figure, description, source)                                                                                     | **Deletes and re-inserts** them                        |

To apply a changed seed on purpose, run the file yourself (or, better, ship the change as a content migration, above): `psql` with the dashboard connection string (Project Settings, Database, Connection string) and `-f supabase/seed.sql`, or paste it into the dashboard SQL editor. Before the admin (#26 and #27) ships, the seed must become insert only, so a re-run cannot revert admin edits.

Then, in the dashboard: turn off sign-ups, confirm that only `public` is exposed, and look at both Advisors (security and performance). `graphql_public` is also listed as exposed on hosted projects. That is expected: it honours the same grants and RLS, so it shows nothing the REST API would not, and it is not a leak. Run `pnpm db:smoke` (it reads `.env.local`), and only after it passes disable the legacy keys.

## Reading data in the app

Pages call the cached readers, never the database directly:

| Reader               | Returns                                     | Cache tag                           |
| -------------------- | ------------------------------------------- | ----------------------------------- |
| `getSettings()`      | Site settings                               | `settings`                          |
| `getFlags()`         | Flags that are on (missing means off)       | `flags`                             |
| `getStops()`         | Published stops with their sourced outcomes | `stops`                             |
| `getCaseStudy(slug)` | One published case study, or `null`         | `case-studies`, `case-study:<slug>` |
| `getLabProjects()`   | Published lab projects with outcomes        | `lab`                               |
| `getCountries()`     | Published countries with their trips        | `travel`                            |

- Each reader except `getFlags()` uses `'use cache'` and `cacheTag`. It keeps a good result for days (`cacheLife('days')`) and a failure for minutes (`cacheLife('minutes')`), so an outage heals quickly. `getFlags()` follows its own rules (below). The `seconds` profile is never used (it is never prerendered). Next.js docs: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` and `.../04-functions/cacheLife.md`.
- A reader, except `getFlags()`, never throws. It returns `{ ok: true, data }` or `{ ok: false, reason }` (`unconfigured`, `invalid_config`, `query_failed`, `invalid_data`). Show the empty state on `ok: false`.
- Each reader creates its client inside the cached function, so no client is shared across requests.
- After an edit, call `expireTag(tag)` from `src/lib/db/expire-tag.ts` with the matching tag from `src/lib/db/tags.ts`, not a bare `revalidateTag`. It expires the tag now and again 5 seconds later, because Next.js keeps a page that was mid rebuild at the moment of the change (see [flags.md](flags.md#a-page-that-was-mid-rebuild)).

## Feature flags

Every flag, its state and how to switch it is in [flags.md](flags.md). How a flag reaches the site is decision 0018. In short: the pages are prerendered from `getFlags()`, a cached read tagged `flags`, and a Supabase Database Webhook asks the site to refresh that cache when a flag changes.

### The flag reader

`getFlags()` (`src/lib/db/queries/flags.ts`) is the only reader that **throws**:

- **Supabase not configured** (no URL or key at all): it returns an empty map, so every flagged page is Off. This is local development and unit tests without the variables.
- **Configured and the read works**: the flags that are On, cached for an hour (`cacheLife("hours")`) as a backstop.
- **Configured and the read fails**: it returns the last good flags this process read, cached for a minute so it tries again soon. If the process has never read them, it throws: `next build` fails (instead of baking in a site where every page is hidden) and a rebuild leaves the page as it was.

The public role only sees flags that are On, so a missing key means Off, and Preview is never visible to a visitor. Until Auth (#23) Preview behaves as Off for everyone.

### Set up the webhook (owner, once, after the first deploy that has `/api/revalidate`)

The webhook is made by hand in the dashboard, never in a migration: its Authorization header holds a secret, and a migration would put that secret in this public repository. **Never run `supabase db pull`, and never share a schema dump** (`supabase db dump`, a dashboard export): the webhook trigger and its header, secret included, appear in any dump of the database, not only in a pull. It would write the webhook, header and secret included, into a migration file. `scripts/check-supabase-webhook.test.ts` fails if anything under `supabase/` contains `http_request` or `Authorization`, so a pull cannot be committed by accident.

1. Make a secret: `openssl rand -hex 32`. Keep it in your password manager.
2. Put it on the server, with the other runtime secrets (`docs/deploy.md`): add `REVALIDATE_SECRET=<the secret>` to `/home/apps/personal-website/.env` (mode 600) through the infra helper, then recreate the container so it reads it. Until it is set, `/api/revalidate` answers 503 and does nothing.
3. In the Supabase dashboard, open **Integrations, Database Webhooks** (older dashboards: **Database, Webhooks**) and choose **Create a new hook** and set:
   - **Name:** `revalidate_flags`
   - **Table:** `public.feature_flags`
   - **Events:** Insert, Update and Delete
   - **Type of hook:** HTTP Request
   - **Method:** `POST`
   - **URL:** `https://staging.olaheavy.dev/api/revalidate` (staging and production share this project and these flags, so add a second hook with `https://olaheavy.dev/api/revalidate` once production is live)
   - **HTTP headers:** keep `Content-Type: application/json`, and add `Authorization` with the value `Bearer <the secret>`
   - **Timeout:** 5000 ms
4. Test it: change one flag in the Table Editor (for example set `page.lab` to `off`), wait a couple of seconds, and open `/lab` (it should be a 404 and Lab should have left the navigation). Set it back to `on` and check Lab returns. **Delivery log:** Database, Webhooks, the hook's logs show each call and its status (200 is success; 401 means the secret differs; 503 means the server has no secret; 429 means more than 30 wrong attempts a minute from one address).
5. If a webhook call is ever lost, the pages catch up within an hour on their own (the `cacheLife("hours")` backstop). To refresh at once, send the call by hand: `curl -X POST -H "Authorization: Bearer <the secret>" -H "Content-Type: application/json" -d '{"tag":"flags"}' https://staging.olaheavy.dev/api/revalidate`.

To rotate the secret, change it on the server and in the hook's header, in that order, and recreate the container. Only a call with the right secret can refresh anything, and the route only accepts the `flags` tag.

### In tests

`make build` and `make e2e` do not use the hosted project. `e2e/fixtures/fake-supabase.mjs` is a small test only server that answers `feature_flags` like the public role does (On rows only), and `stops` and `lab_projects` with their outcomes from `e2e/fixtures/fake-content.mjs` (a unit test checks every figure, wording and link in it against `supabase/seed.sql`; `POST /__control {"content": "empty" | "error"}` switches its answer). `make build` starts it so `next build` can read the flags, and Playwright starts it for the run. `make e2e-flags` runs the `@flags` journeys, which change its answer and call `/api/revalidate` like the webhook does; they run alone, one at a time, because they share that state. `FAKE_FLAGS_OFF=page.work,page.lab` starts the fake (and every reset) without those flags, so `make e2e-cold` can build with pages Off.

## Backups

Free plan projects have no point in time recovery. Until the admin (#27) edits content in the database, the repository is the backup: the migrations and `seed.sql` rebuild everything. Revisit before the admin ships.
