"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";

// "Read more" / "Show less" for compact tickets. The height animates by growing a
// grid row from 0fr to 1fr (see ".ticket-expander" in globals.css), so nothing is
// measured. A URL hash matching `anchorId` (for example /work#mukuru) opens it, on
// first load and on later same-page navigation (hashchange, back and forward through
// popstate, and the Navigation API where it exists, which also covers clicking a link
// to the hash that is already in the URL).

type NavigationLike = EventTarget | undefined;
const getNavigation = (): NavigationLike =>
  (window as unknown as { navigation?: EventTarget }).navigation ?? undefined;

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  const navigation = getNavigation();
  navigation?.addEventListener("currententrychange", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    navigation?.removeEventListener("currententrychange", onChange);
  };
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

export function TicketExpander({
  anchorId,
  children,
  moreLabel = "Read more",
  lessLabel = "Show less",
}: {
  /** The id of the ticket (or section) this expands, matched against the URL hash. */
  anchorId?: string;
  children: ReactNode;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const regionId = useId();
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const matches = anchorId != null && hash === `#${anchorId}`;
  // The visitor's own choice wins until the URL points at this ticket again.
  // `visit` counts those arrivals; a choice made before the latest one is stale.
  const [visit, setVisit] = useState(0);
  const [choice, setChoice] = useState<{ open: boolean; visit: number } | null>(null);
  const open = choice && choice.visit === visit ? choice.open : matches;

  useEffect(() => {
    if (anchorId == null) return;
    const arrived = () => {
      if (window.location.hash === `#${anchorId}`) setVisit((n) => n + 1);
    };
    window.addEventListener("hashchange", arrived);
    window.addEventListener("popstate", arrived);
    const navigation = getNavigation();
    navigation?.addEventListener("currententrychange", arrived);
    return () => {
      window.removeEventListener("hashchange", arrived);
      window.removeEventListener("popstate", arrived);
      navigation?.removeEventListener("currententrychange", arrived);
    };
  }, [anchorId]);

  return (
    <div>
      <div id={regionId} className="ticket-expander" data-open={open ? "" : undefined}>
        <div inert={!open}>{children}</div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setChoice({ open: !open, visit })}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
      >
        {open ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
