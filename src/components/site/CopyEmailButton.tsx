"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { useToast } from "./Toast";

// Secondary contact action for visitors without a mail app. Clicking always
// reveals the address as selectable text, so it works even where copying
// doesn't (no Clipboard API, or permission refused); the toast says which.
export function CopyEmailButton() {
  const { show } = useToast();
  const [revealed, setRevealed] = useState(false);

  async function copy() {
    setRevealed(true);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(site.email);
      show(`Email copied: ${site.email}`);
    } catch {
      show(`Email: ${site.email}`);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 font-medium transition-colors duration-150 hover:bg-bg-secondary"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </svg>
        Copy email
      </button>
      {revealed ? (
        <span className="font-mono text-sm break-all text-text-primary select-all">{site.email}</span>
      ) : null}
    </>
  );
}
