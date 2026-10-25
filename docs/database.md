# Database

The site's content, flags and travel data live in hosted Supabase (decision 0004): Postgres with pgvector. The schema, the seed and the tests are in `supabase/`; the typed data layer is in `src/lib/db/`. Nothing in the repository holds a secret.

## How it fits together

| Piece                          | What it is                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `supabase/migrations/*.sql`    | The schema: extensions and enums, tables and constraints, then grants and row level security     |
| `supabase/seed.sql`            | The first content, from the claims policy only (decision 0005). Safe to run again                |
| `supabase/tests/*.test.sql`    | pgTAP tests of the rules above (`make db-test`)                                                  |
| `src/lib/db/database.types.ts` | Types generated from the schema (`make db-types`). Never edit by hand                            |
| `src/lib/db/queries/*`         | Typed, cached reads for the pages                                                                |
| `src/lib/db/admin.ts`          | The secret key client for the server (admin and webhooks later). ESLint limits who may import it |

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

| Data                                                                                                                   | A re-run                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `settings`, `feature_flags`                                                                                            | Inserts missing rows only. Never overwrites an edit    |
| `stops`, `case_studies` (title and stop link), `case_study_sections` (title and position), `lab_projects`, `countries` | **Overwrites** the seeded columns with the seed values |
| `outcomes` for the seeded stops and lab projects                                                                       | **Deletes and re-inserts** them                        |

To apply a changed seed on purpose, run the file yourself: `psql` with the dashboard connection string (Project Settings, Database, Connection string) and `-f supabase/seed.sql`, or paste it into the dashboard SQL editor. Before the admin (#26 and #27) ships, the seed must become insert only, so a re-run cannot revert admin edits.

Then, in the dashboard: turn off sign-ups, confirm that only `public` is exposed, and look at both Advisors (security and performance). `graphql_public` is also listed as exposed on hosted projects. That is expected: it honours the same grants and RLS, so it shows nothing the REST API would not, and it is not a leak. Run `pnpm db:smoke` (it reads `.env.local`), and only after it passes disable the legacy keys.

## Reading data in the app

Pages call the cached readers, never the database directly:

| Reader                            | Returns                                     | Cache tag                           |
| --------------------------------- | ------------------------------------------- | ----------------------------------- |
| `getSettings()`                   | Site settings                               | `settings`                          |
| `getFeatureFlags()`, `isFlagOn()` | Flags that are on (missing means off)       | `flags`                             |
| `getStops()`                      | Published stops with their sourced outcomes | `stops`                             |
| `getCaseStudy(slug)`              | One published case study, or `null`         | `case-studies`, `case-study:<slug>` |
| `getLabProjects()`                | Published lab projects with outcomes        | `lab`                               |
| `getCountries()`                  | Published countries with their trips        | `travel`                            |

- Each reader uses `'use cache'` and `cacheTag`. It keeps a good result for days (`cacheLife('days')`) and a failure for minutes (`cacheLife('minutes')`), so an outage heals quickly. The `seconds` profile is never used (it is never prerendered). Next.js docs: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` and `.../04-functions/cacheLife.md`.
- A reader never throws. It returns `{ ok: true, data }` or `{ ok: false, reason }` (`unconfigured`, `invalid_config`, `query_failed`, `invalid_data`). Show the empty state on `ok: false`.
- Each reader creates its client inside the cached function, so no client is shared across requests.
- After an edit, call `revalidateTag` with the matching tag from `src/lib/db/tags.ts`.

## Backups

Free plan projects have no point in time recovery. Until the admin (#27) edits content in the database, the repository is the backup: the migrations and `seed.sql` rebuild everything. Revisit before the admin ships.
