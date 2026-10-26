import "server-only";
import { notFound } from "next/navigation";
import { getFlags } from "@/lib/db/queries/flags";
import { getViewer, isFlagVisible } from "./visibility";

/**
 * Call first in `generateMetadata` and again at the top of the page. If the flag hides the
 * page from this viewer it answers the site's own 404 (the Wrong turn page), so a hidden
 * page answers the same status and robots header as a mistyped address. Doing it in `generateMetadata` as well keeps
 * the hidden page's own title out of the 404. Both reads share one cached `getFlags()`,
 * which is why the page stays prerendered (decision 0018).
 *
 * THE RULE: nothing request bound may run before the gate. No cookies(), headers(),
 * connection(), searchParams or uncached read in this file, in `getViewer()`, or in front of a
 * `gatePage()` call. Next.js fixes the HTTP status when the response starts streaming; a gate
 * that runs after request time work (or inside a Suspense boundary that suspends) calls
 * notFound() too late and the hidden page answers 200 with a noindex body, a soft 404.
 * Measured in the #88 spike. Docs: node_modules/next/dist/docs/01-app/02-guides/streaming.md
 * ("Status codes"), 03-api-reference/04-functions/not-found.md and
 * 03-api-reference/03-file-conventions/loading.md. gate.test.ts fails if the rule is broken.
 * Owner Preview (#23) must not change this: see docs/flags.md.
 */
export async function gatePage(key: string): Promise<void> {
  const flags = await getFlags();
  if (!isFlagVisible(flags, key, await getViewer())) notFound();
}
