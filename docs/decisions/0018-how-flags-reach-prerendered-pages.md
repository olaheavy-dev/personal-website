# 0018: How feature flags reach prerendered pages

**Status:** Accepted  
**Date:** 2026-10-25  
**Decided by:** the owner (issue #6)

## Context

Decision 0006 says a page switched off by a flag returns 404, and disappears from the navigation, the sitemap, the command palette and the assistant's citations. Decision 0017 and the budget script say the public pages stay prerendered: static HTML that Cloudflare can cache and the single VPS does not have to render on every view.

Those two pull against each other. A flag lives in Supabase and can change at any time, while a prerendered page is built once. Something has to connect them without turning every view into a database read.

## Options

1. **A check on every request** (a proxy or a dynamic page). Always current, but every page renders per request, so no HTML caching (#54), a Supabase read per view, and no prerendered page for the budget script to measure.
2. **Flags in the build only.** Fast, but a flag change needs a redeploy, which defeats decision 0006.
3. **Prerender from a cached, tagged flag read, and refresh the cache when a flag changes.** Pages stay static; the owner's change reaches them in about a second.

## Decision

Option 3.

- **`getFlags()`** (`src/lib/db/queries/flags.ts`) is a cached read of `feature_flags`, tagged `flags`, with `cacheLife("hours")` as a backstop. The public role only sees rows that are On, so a missing key means Off.
- **Pages gate themselves.** Each flagged page awaits `gatePage(key)` first in `generateMetadata` and again at the top of the page. An Off page calls `notFound()` while it is being prerendered, so it is built as a static 404 with the Wrong turn title, noindex and a real 404 status. Gating in `generateMetadata` keeps the hidden page's own title out of the 404. No `connection()` and no proxy: the page stays static.
- **Everything else reads the same list.** `src/lib/flags/registry.ts` is the one list of flagged pages. The navigation (through the root layout), the 404's way back, the sitemap, and later the command palette and the assistant's citations all derive from it, so a hidden page disappears from all of them together. A section of a page uses the `FlagGate` component instead, which renders nothing, with no gap, when its flag is Off.
- **A flag change reaches the site through a webhook.** A Supabase Database Webhook on `feature_flags` calls `POST /api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>`. The route calls `revalidateTag("flags", { expire: 0 })`, so the next request rebuilds the pages from the new flags instead of being served the old ones, and calls it once more 5 seconds later with `after()`, because Next.js treats a page whose rebuild began before the change but finished after it as fresh (added 26 Oct 2026, after three CI failures; detail in [flags.md](../flags.md)). The route accepts POST only, compares the secret in constant time, answers 503 when the secret is not set, accepts only allow listed tags, and counts wrong guesses only, 30 a minute per address (a caller with the right secret is never limited). The hour long `cacheLife` is the backstop if a webhook call is ever lost.
- **A failed read never means "everything is Off".** `getFlags()` throws if Supabase is configured and the read fails, and returns an empty map (everything Off) only when Supabase is not configured at all. Next.js does not keep the last good page when a rebuild throws (see the spike results below), so the reader keeps the last good flags in memory: if a later read fails, it returns them and retries after a minute. If the process has never read the flags, it throws, which fails `next build` instead of baking in a site where every page is hidden.
- **Preview behaves as Off until Auth (#23).** A `Viewer` type (`public` or `owner`) and `isVisible(state, viewer)` exist, with Preview visible to the owner only, but `getViewer()` returns `public` until the owner can sign in. The Preview banner moves to the admin shell task. Because the public role never receives a Preview row, a Preview page is already Off for everyone today.
- **The build needs the flags.** `next build` reads them while it prerenders, so the Supabase browser values must be present at build time. The Docker build and the publish workflow already guard this (#95). Tests and local checks build against a fake Supabase server (`e2e/fixtures/fake-supabase.mjs`), which `make build` starts and stops.
- **`/healthz` reports `"supabase":"configured"` or `"unconfigured"`**, read at request time, never a value. The publish workflow starts the candidate image with no Supabase variables and refuses to publish unless it says `configured`, which proves the values were written into the build. The post-deploy smoke checks the live site says the same.

## Spike results (25 October 2026, Next.js 16.4.3, standalone server, fake Supabase)

- **An Off page at build is a static 404.** `/_lab/hidden`, whose flag is never set, answers 404 with `x-nextjs-prerender: 1` and noindex, titled "Wrong turn | Sunkanmi Olawuwo".
- **Off after a revalidation is a 404 on the next request.** With `page.work` removed from the fake and `/api/revalidate` called once, the next `GET /work` was 404, the sitemap lost `/work`, and the navigation lost Work. Putting the flag back returned 200 on the next request.
- **A failed read during a rebuild does not keep the last good page by itself.** With the fake answering 500 and a throwing reader, every page, `/` and the sitemap included, answered 500 after a revalidation, both with `{ expire: 0 }` and with the `"max"` profile. With a short time based backstop, pages that had been rebuilt before the outage stayed 200, but a page that no request had rebuilt yet answered 500. Keeping the last good flags in memory fixed the revalidation case: with the fake answering 500, every page and the sitemap stayed 200 through the outage.

## Consequences

- **A hidden page is not the same page as a mistyped address.** It answers the same status (404) and the same robots header, and carries nothing of its own (no title, no text). But Next.js writes the static 404 of a page that calls `notFound()` while prerendering as an error shell: the body, `Cache-Control` and `<html>` attributes (no `lang`) differ from the prerendered `/_not-found`, and the visible Wrong turn page and its `<title>` are drawn by the browser from the page data. A visitor with JavaScript off who opens a hidden URL sees an empty page. Nothing links to a hidden page, no cheap alternative was found, and the difference is accepted. Earlier wording that a hidden page looks exactly like a mistyped one was wrong.
- **Every unknown address is rendered under one fixed path.** The 404 reads the flags (for its way back), so Next rebuilds it after every revalidation, for the address of whichever request came first, and that address would end up in the cached page and be served to everyone. `src/proxy.ts` therefore rewrites every address no route owns (not `_next`, `api`, `healthz`, files with an extension, `/` or the registered pages) to `/not-found-unmatched`. The proxy reads no data. `proxy.test.ts` fails if its matcher and the registry drift.
- **The cold process window is wider than first written.** The last good flags live in memory, and the cache entry for `getFlags()` expires after one day (`expire`). A fresh container, an image rolled back after more than a day, or a container idle for a day has no last good flags and no usable cache entry, so the first request blocks on a read. If Supabase is unreachable at that moment every page answers 500 until it returns. An instrumentation seed at boot would narrow it; it was left out on purpose.
- **The webhook is configured by hand in the Supabase dashboard**, because its Authorization header holds the secret and a migration would put the secret in this public repository. A test fails if anything under `supabase/` contains `http_request` or `Authorization`, and `supabase db pull` must not be run. Steps are in `docs/database.md`.
- **Edge caching.** Cloudflare must not cache HTML for longer than 60 seconds (#54), or a flag change would wait for the edge copy to expire.
- **The sitemap, the layout and every flagged page read the same cached answer**, so a flag change is consistent across them after one revalidation.
- **Easy to reverse.** Options 1 and 2 remain open: the gate is one function, `gatePage`, and the registry is one file.
