"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

// How long the button says "Copied" before it goes back to "Copy email".
const COPIED_MS = 2000;

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
// that gets replaced, so screen readers hear every outcome. Its message sits in
// an element keyed by a counter: each success remounts it, so a repeated "Email
// copied" is announced again.
export function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const address = useRef<HTMLParagraphElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

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
      clearTimeout(timer.current);
      setCopied(false);
      setFailed(true);
      return;
    }
    setCount((previous) => previous + 1);
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
        <p
          ref={address}
          tabIndex={-1}
          className="min-h-11 max-w-full rounded-lg border border-border-strong px-4 py-3 font-mono text-sm break-all select-all"
        >
          {site.email}
        </p>
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
              <path d="M5 12.5 10 17.5 19 7" />
            </svg>
            Copied
          </span>
        </button>
      )}
      <div role="status" data-testid="copy-email-status" className="sr-only">
        {failed ? "Select the address to copy it" : count > 0 ? <span key={count}>Email copied</span> : null}
      </div>
    </>
  );
}
