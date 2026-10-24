"use client";

import { site } from "@/lib/site";
import { useToast } from "./Toast";

// Secondary contact action for visitors without a mail app: copies the address
// and announces it.
export function CopyEmailButton() {
  const { show } = useToast();

  function copy() {
    navigator.clipboard?.writeText(site.email).then(
      () => show(`Email copied: ${site.email}`),
      () => show(`Email: ${site.email}`),
    );
  }

  return (
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
  );
}
