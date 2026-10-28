"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";

// "Read more" / "Show less" for a ticket's details (every Work ticket that has some). The height animates by growing a
// grid row from 0fr to 1fr (see ".ticket-expander" in globals.css), so nothing is
// measured. Without JavaScript the content is open and the button is hidden; before hydration
// the head script's deep link rule (openDeepLinkedTicket in src/lib/theme-script.ts) and a
// :target rule (globals.css) pre-open it with no layout shift. A URL hash matching `anchorId`
// (for example /work#mukuru) opens it, on
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

// False while the server HTML is on screen (and during hydration), true once React runs in the
// browser. Until then the content is not inert, so a visitor without JavaScript can read it all.
const subscribeNever = () => () => {};
const isHydrated = () => true;
const notHydrated = () => false;

export function TicketExpander({
  anchorId,
  children,
  moreLabel = "Read more",
  lessLabel = "Show less",
  subject,
  aside,
}: {
  /** The id of the ticket (or section) this expands, matched against the URL hash. */
  anchorId?: string;
  children: ReactNode;
  moreLabel?: string;
  lessLabel?: string;
  /**
   * What it expands ("Mukuru"). It joins the button's accessible name, "Read more about Mukuru",
   * which still starts with the visible words (WCAG 2.5.3), so a list of buttons is not a list of
   * identical "Read more".
   */
  subject?: string;
  /**
   * A quiet line on the same row as the button, at the far end (a work ticket's areas). It is
   * built on the server and passed in, so it adds no client code. It stays visible when the
   * ticket is closed or open, because it sits outside the collapsing region.
   */
  aside?: ReactNode;
}) {
  const regionId = useId();
  const hydrated = useSyncExternalStore(subscribeNever, isHydrated, notHydrated);
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

  const label = open ? lessLabel : moreLabel;
  return (
    <div>
      {/* Before hydration CSS alone decides: a ticket the URL points at is open (the head
          script's deep link rule from src/lib/theme-script.ts, and the :target rule in
          globals.css), and without JavaScript the root layout's noscript style opens them all.
          data-hydrated ends both rules, so from then on the state above decides. */}
      <div
        id={regionId}
        className="ticket-expander"
        data-open={open ? "" : undefined}
        data-hydrated={hydrated ? "" : undefined}
      >
        <div inert={hydrated && !open}>{children}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          aria-label={subject ? `${label} about ${subject}` : undefined}
          onClick={() => setChoice({ open: !open, visit })}
          className="ticket-expander-toggle inline-flex min-h-11 items-center text-sm font-medium text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
        >
          {label}
        </button>
        {aside}
      </div>
    </div>
  );
}
