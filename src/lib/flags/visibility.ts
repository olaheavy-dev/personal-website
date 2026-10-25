import type { FeatureFlags, FlagState } from "@/lib/db/types";

// Who is looking. Today everyone is `public`. The owner's `owner` viewer arrives with
// Auth (#23), which is also when the Preview banner is built. Until then Preview behaves
// exactly like Off for every visitor (decision 0018).
export type Viewer = "public" | "owner";

/** The viewer for this request. Always public until Auth (#23) can tell the owner apart. */
export async function getViewer(): Promise<Viewer> {
  return "public";
}

/** On is visible to everyone, Preview to the owner only, Off (or a missing key) to nobody. */
export function isVisible(state: FlagState | undefined, viewer: Viewer): boolean {
  if (state === "on") return true;
  if (state === "preview") return viewer === "owner";
  return false;
}

/** True when the flag lets this viewer see its page or section. */
export function isFlagVisible(flags: FeatureFlags, key: string, viewer: Viewer): boolean {
  return isVisible(flags[key], viewer);
}
