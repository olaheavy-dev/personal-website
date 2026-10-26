# 0019: Content ships as migrations, and merging applies migrations before the site is built

**Status:** Accepted  
**Date:** 2026-10-26  
**Decided by:** the owner (issue #108)

## Context

The hosted project only got new content through snippets the owner pasted into the SQL editor by hand, because `supabase db push --include-seed` skips a seed that has changed (`docs/database.md`, "What the seed does"). The pages are prerendered when the image is built and stop content is cached for days, so a forgotten snippet leaves the live site on old copy, and a snippet run after the build changes nothing visitors see.

## Decision

**A. Until the admin ships, a content change is a migration.**

- It is a file in `supabase/migrations/` made with `pnpm exec supabase migration new short_name`.
- It must be safe to run again, and safe on a fresh database: an `update ... where slug = ...`, and for outcomes a `delete` keyed by the stop followed by `insert ... select ... from public.stops where slug = ...`, so it inserts nothing when the stop does not exist yet.
- `supabase/seed.sql` keeps the same values, so a local reset and the first hosted push give the same content. A Vitest check (`scripts/check-seed.test.ts`) fails if a content migration and the seed disagree, and a pgTAP test (`supabase/tests/content_migration.test.sql`) replays the migration on seeded data and checks nothing changed.
- When the admin (#26, #27) ships, content migrations stop. Content is then edited in the admin, and migrations are for structure only. A re-run of the seed must not overwrite admin edits either (`docs/database.md`).

**B. Merging to `main` applies pending migrations before the image is built.**

- `publish.yml` has a `migrate` job. The publish job `needs` it. The job runs `supabase link`, then `supabase db push --dry-run` (logged), then `supabase db push`, with no `--include-seed`. It uses the CLI pinned in `package.json`, through `pnpm exec`.
- A failed migration stops the run, so nothing is built or pushed, and the site keeps serving the previous image.
- The job has the same guard as the publish job: it checks out `main` and refuses to run unless `main` still points at the commit CI checked, so it never migrates a commit CI did not check.
- The job uses the GitHub environment `supabase-production`, limited to `main`, and has `contents: read` only.

**C. Migrations must be backwards compatible with the running image.** For the minutes between the migration and the deploy, the old image is still serving and reading the database. So add a column, table or enum value before any code uses it, and remove or rename something only in a later migration, after the code stops reading it.

**D. Secrets.** `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are secrets of the `supabase-production` environment, and the project ref is the variable `SUPABASE_PROJECT_REF`. They reach the CLI as environment variables of single steps, never as arguments, and are never printed. No agent ever sees them, and the owner sets them (`docs/deploy.md`, Owner setup).

## Options considered

1. **Keep pasting snippets by hand.** No new access to production, but it relies on remembering, and the order against the image build is easy to get wrong.
2. **Apply migrations on merge (chosen).** Production data is changed by CI, so a bad migration reaches production on merge.
   - **Variant: `supabase db push --db-url`** with the connection string instead of an access token and `link`. It needs no token (and so no way to read the secret key), but it needs the session pooler URL (the direct host is IPv6 only and GitHub runners are IPv4), a percent-encoded password in a URL, and puts the whole connection string in a secret. The token route follows the Supabase guide, so we chose it; this variant stays open if the token proves too broad.
3. **Apply migrations from the deploy server.** Needs database credentials on the VPS and cannot run before the image build.

## Consequences

- A bad migration reaches production when its pull request merges. The mitigations are the `database` check in CI (reset, pgTAP, lint), the logged dry run, the backwards compatible rule, and reviewing every migration as a production change. Migrations are never edited after they have been merged; a mistake is fixed by a new migration.
- Changes to `publish.yml` and the environment are owner-only (decision 0015). A pull request that only adds a migration follows the normal rules, but its reviewer treats it as a production change.
- Publishing now also needs the database to be reachable and the three values set. The job fails with a message naming the missing value.
- The `db push` command stores each applied migration in the hosted project's history, so the dry run lists only migrations that are not there yet.
- Easy to reverse: removing the `migrate` job and the `needs` line returns to manual pushes.
