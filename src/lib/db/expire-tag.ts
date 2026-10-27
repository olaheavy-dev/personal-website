import { revalidateTag } from "next/cache";
import { after } from "next/server";

// How long after the first expiry the tag is expired again, in milliseconds.
export const secondPassAfterMs = 5000;

/**
 * Expires a cache tag now, and once more 5 seconds later. Use it for every on demand refresh
 * from a request (the flags webhook, and later the admin and publish webhooks), not a bare
 * `revalidateTag`.
 *
 * Why twice: Next.js 16.4.3 stamps a rebuilt page with the time its render finished, not the
 * time it began (`set()` in server/lib/incremental-cache/file-system-cache.js writes
 * `lastModified: Date.now()`, and `areTagsExpired` in tags-manifest.external.js compares the tag's
 * expiry with that stamp). A page whose render started before the change and ended after the
 * first expiry therefore counts as newer, and is served as fresh with the old data until the tag
 * is expired again. `'use cache'` entries are not affected: use-cache-wrapper.js stamps them with
 * `timestamp: startTime`. The second pass rebuilds any page that finished in between, so a page
 * that straddled the change is wrong for at most the pause. Measured: docs/flags.md.
 *
 * One second pass per call, not several: revalidations made inside `after()` are executed
 * together when that request's last callback ends (server/after/after-context.js `runCallbacks`
 * and server/revalidation-utils.js `withExecuteRevalidates`). Each call still schedules its own
 * pass. The pause stays under the 10 to 30 seconds a stopping self hosted server waits for pending
 * `after` work (docs/01-app/02-guides/self-hosting.md, "after"). Remove the second pass when a
 * Next.js upgrade stamps pages with the start time (see docs/flags.md, "When to remove").
 */
export function expireTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, secondPassAfterMs));
    revalidateTag(tag, { expire: 0 });
  });
}
