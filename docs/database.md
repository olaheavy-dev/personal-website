# Database

The site's content, flags and travel data live in hosted Supabase (decision 0004): Postgres with pgvector. The schema, the seed and the tests are in `supabase/`; the typed data layer is in `src/lib/db/`. Nothing in the repository holds a secret.

## How it fits together

| Piece                          | What it is                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/*.sql`    | The schema: extensions and enums, tables and constraints, then grants and row level security              |
| `supabase/seed.sql`            | The first content, from the claims policy only (decision 0005). Safe to run again                         |
| `supabase/snippets/*.sql`      | One off statements for the owner to paste into the hosted SQL editor when a changed seed cannot be re-run |
| `supabase/tests/*.test.sql`    | pgTAP tests of the rules above (`make db-test`)                                                           |
| `src/lib/db/database.types.ts` | Types generated from the schema (`make db-types`). Never edit by hand                                     |
| `src/lib/db/queries/*`         | Typed, cached reads for the pages                                                                         |
| `src/lib/db/admin.ts`          | The secret key client for the server (admin and webhooks later). ESLint limits who may import it          |

## Keys

Only the new Supabase keys are supported. The code refuses the legacy `anon` and `service_role` keys.

| Variable                               | Where              | Notes                                                          |
| -------------------------------------- | ------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser and server | `https://<project-ref>.supabase.co`                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Starts `sb_publishable_`. Safe to publish; RLS guards the data |
| `SUPABASE_SECRET_KEY`                  | Server only        | Starts `sb_secret_`. Bypasses RLS. Never `NEXT_PUBLIC_`        |

`make check` runs `scripts/check-client-secrets.mjs`, which fails if the browser bundle contains the secret key or its variable name, if a `NEXT_PUBLIC_` variable carries a secret, or if a client component imports `src/lib/db/admin.ts`.

## Tables

| Table                          | Holds                                                                                          | Public read                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------- |
| `settings`                     | Name, one liner, availability, time zone, social links (key and JSON value)                    | All rows                          |
| `feature_flags`                | `page.*`, `case.*`, `feature.*` with state on, preview or off. `page.home` is locked on        | Rows that are `on`                |
| `stops`                        | Jobs and engagements, numbered 01 to 07, years only, with the Work filters                     | Published                         |
| `case_studies`                 | Long write-ups, TL;DR bullets. Publishing needs 1 to 4 bullets and at least 3 sourced outcomes | Published                         |
| `case_study_sections`          | The seven fixed sections (`context` to `reflection`)                                           | With a published case study       |
| `outcomes`                     | Figures with their source. One parent (stop, case study or lab project)                        | With a published parent           |
| `lab_projects`                 | Personal projects, evidence links, `in_progress`. `raglab` is refused                          | Published                         |
| `media`                        | Images and video. Alt text needed to publish; AI generated images need a caption               | Published                         |
| `countries`, `trips`, `photos` | Travel. One home country. Photos carry no coordinates                                          | Published, with published parents |
| `posts_cache`                  | Hashnode posts cached for Writing                                                              | Published                         |
| `kb_chunks`                    | Assistant knowledge: `vector(1024)` embeddings (HNSW cosine), generated `fts` (GIN)            | Never (server only)               |
| `assistant_evals`              | Questions the assistant is scored against                                                      | Never (server only)               |

### The claims policy in constraints

The database refuses what the claims policy forbids, so a mistake in the admin cannot reach the site.

- An outcome has exactly one parent.
- A `link` source needs an `https://` URL, a label, the day it was last checked (`checked_on`) and no note. An `own` source needs a note and no URL.
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

1. `pnpm exec supabase migration new short_name`, then write the SQL. Migrations are never edited after they have been pushed.
2. Add or update the tests in `supabase/tests/`.
3. `make db-check`; commit the regenerated `database.types.ts`.
4. The owner pushes it (below).

## Pushing to the hosted project (owner only)

The project is `qixsdwyfuewbhxbcaufl` (London, Free plan). The agent never has its keys or its database password.

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

To apply a changed seed on purpose, run the file yourself: `psql` with the dashboard connection string (Project Settings, Database, Connection string) and `-f supabase/seed.sql`, or paste it into the dashboard SQL editor. Before the admin (#26 and #27) ships, the seed must become insert only, so a re-run cannot revert admin edits.

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
- After an edit, call `revalidateTag` with the matching tag from `src/lib/db/tags.ts`.

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

`make build` and `make e2e` do not use the hosted project. `e2e/fixtures/fake-supabase.mjs` is a small test only server that answers `feature_flags` like the public role does (On rows only), and `stops` and `lab_projects` with their outcomes from `e2e/fixtures/fake-content.mjs` (a unit test checks every figure, wording and link in it against `supabase/seed.sql`; `POST /__control {"content": "empty" | "error"}` switches its answer). `make build` starts it so `next build` can read the flags, and Playwright starts it for the run. `make e2e-flags` runs the `@flags` journeys, which change its answer and call `/api/revalidate` like the webhook does; they run alone, one at a time, because they share that state.

## Backups

Free plan projects have no point in time recovery. Until the admin (#27) edits content in the database, the repository is the backup: the migrations and `seed.sql` rebuild everything. Revisit before the admin ships.
