"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Ticket } from "@/components/ticket/Ticket";

type Outcome = "copied" | "select";

// Secondary contact action for visitors without a mail app. Clicking always
// prints a small boarding pass with the address as selectable text, so it works
// even where copying doesn't (no Clipboard API, or permission refused); the pass
// says which. The status region is always rendered (and empty until the first
// click) so screen readers announce each new pass; the counter in the key
// reprints, and so reannounces, on every click.
export function CopyEmailButton() {
  const [pass, setPass] = useState<{ outcome: Outcome; count: number } | null>(null);

  async function copy() {
    let outcome: Outcome = "copied";
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(site.email);
    } catch {
      outcome = "select";
    }
    setPass((previous) => ({ outcome, count: (previous?.count ?? 0) + 1 }));
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
      <div role="status" className="w-full empty:absolute">
        {pass ? (
          <Ticket
            key={pass.count}
            as="div"
            size="mini"
            className="boarding-pass w-full sm:w-fit"
            eyebrow={<span aria-hidden="true">Next stop: your email</span>}
          >
            <p className="text-sm font-medium">
              {pass.outcome === "copied" ? "Email copied" : "Select to copy"}
              <span className="sr-only">, </span>
            </p>
            <p className="font-mono text-sm break-all select-all">{site.email}</p>
          </Ticket>
        ) : null}
      </div>
    </>
  );
}
