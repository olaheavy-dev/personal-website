"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

// "Read more" / "Show less" for compact tickets. The height animates by growing a
// grid row from 0fr to 1fr (see ".ticket-expander" in globals.css), so nothing is
// measured. A URL hash matching `anchorId` (for example /work#mukuru) opens it.

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
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
  // null means "follow the URL"; once the visitor presses the button, their choice wins.
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? (anchorId != null && hash === `#${anchorId}`);

  return (
    <div>
      <div id={regionId} className="ticket-expander" data-open={open ? "" : undefined}>
        <div inert={!open}>{children}</div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setChoice(!open)}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
      >
        {open ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
