import type { ReactNode } from "react";
import { getFlags } from "@/lib/db/queries/flags";
import { getViewer, isFlagVisible } from "@/lib/flags/visibility";

/**
 * Shows its children only when the flag is visible to this viewer. For a section of a page
 * (for example the Lab strip on Home); a whole page uses `gatePage` instead, so it 404s.
 * Renders nothing, no wrapper and no gap, when hidden.
 */
export async function FlagGate({
  flag,
  children,
  fallback = null,
}: {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const flags = await getFlags();
  return isFlagVisible(flags, flag, await getViewer()) ? children : fallback;
}
