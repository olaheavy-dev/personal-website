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
 */
export async function gatePage(key: string): Promise<void> {
  const flags = await getFlags();
  if (!isFlagVisible(flags, key, await getViewer())) notFound();
}
