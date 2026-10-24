"use client";

import { site } from "@/lib/site";
import { useToast } from "./Toast";

// Primary CTA. A plain mailto link (works without JavaScript); with JavaScript
// it also copies the address and says so, for visitors without a mail app.
export function EmailButton({ size = "md" }: { size?: "md" | "lg" | "icon" }) {
  const { show } = useToast();

  function copy() {
    navigator.clipboard?.writeText(site.email).then(
      () => show(`Email copied: ${site.email}`),
      () => {
        // Clipboard blocked: the mailto link still opens the mail app.
      },
    );
  }

  // Compact mail icon for the phone header (information architecture: brand + Email icon).
  if (size === "icon") {
    return (
      <a
        href={`mailto:${site.email}`}
        onClick={copy}
        aria-label="Email me"
        title="Email me"
        className="grid size-11 place-items-center rounded-full bg-accent-primary text-text-inverse transition-colors duration-150 hover:bg-accent-primary-hover active:bg-accent-primary-active"
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </a>
    );
  }

  const padding = size === "lg" ? "px-6 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <a
      href={`mailto:${site.email}`}
      onClick={copy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-primary font-medium text-text-inverse transition-colors duration-150 hover:bg-accent-primary-hover active:bg-accent-primary-active ${padding}`}
    >
      Email me
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
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </a>
  );
}
