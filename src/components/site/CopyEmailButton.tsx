"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

// How long the button says "Copied" before it goes back to "Copy email".
const COPIED_MS = 2000;
// The pause between emptying the status region and writing the message into it.
const ANNOUNCE_MS = 100;

const iconProps = {
  className: "size-4",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

// Secondary contact action for visitors without a mail app. A successful copy
// swaps the button's own label to a check and "Copied" for a moment, so nothing
// else on the page moves. If copying isn't possible (no Clipboard API, or
// permission refused) the button is replaced in place by the address as
// selectable text, so the visitor can still copy it by hand.
//
// The status region is always rendered, visually hidden, and outside the part
// that gets replaced, so screen readers hear every outcome. To make a repeated
// message announce again, each outcome first empties the region and sets the
// text a moment later (a live region only speaks when its content changes).
export function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);
  const address = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      clearTimeout(announceTimer.current);
    };
  }, []);

  function announce(text: string) {
    clearTimeout(announceTimer.current);
    setMessage("");
    announceTimer.current = setTimeout(() => setMessage(text), ANNOUNCE_MS);
  }

  // The button unmounts when copying fails, which would drop focus to the page.
  // Move it to the address instead (focusable by script only, so it adds no tab
  // stop) and select the text, so one more keystroke copies it.
  useEffect(() => {
    if (!failed || !address.current) return;
    address.current.focus();
    try {
      window.getSelection()?.selectAllChildren(address.current);
    } catch {
      // Selection is a convenience; the text stays selectable by hand.
    }
  }, [failed]);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(site.email);
    } catch {
      if (!mounted.current) return;
      clearTimeout(timer.current);
      setCopied(false);
      setFailed(true);
      announce("Select the address to copy it");
      return;
    }
    if (!mounted.current) return;
    announce("Email copied");
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  // Both labels share one grid cell, so the button is always as wide as the
  // wider one and swapping them moves nothing. The label that is not showing is
  // hidden from assistive technology so the button's name is only what is shown.
  const label =
    "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity duration-150 motion-reduce:transition-none";

  return (
    <>
      {failed ? (
        <span className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1">
          <span
            ref={address}
            tabIndex={-1}
            className="inline-flex min-h-11 max-w-full items-center rounded-full border border-border-strong px-6 py-3.5 font-mono break-all select-all"
          >
            {site.email}
          </span>
          <span className="label-mono text-text-tertiary" aria-hidden="true">
            Copy it from here
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={copy}
          className="inline-grid min-h-11 items-center rounded-full border border-border-strong px-6 py-3.5 font-medium transition-colors duration-150 hover:bg-bg-secondary motion-reduce:transition-none"
        >
          <span className={`${label} ${copied ? "opacity-0" : ""}`} aria-hidden={copied}>
            <svg {...iconProps}>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
            </svg>
            Copy email
          </span>
          <span className={`${label} ${copied ? "" : "opacity-0"}`} aria-hidden={!copied}>
            <svg {...iconProps}>
              <path d="M4 12.5 9.5 18 20 6" />
            </svg>
            Copied
          </span>
        </button>
      )}
      <div role="status" data-testid="copy-email-status" className="sr-only">
        {message}
      </div>
    </>
  );
}
