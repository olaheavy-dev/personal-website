"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmailButton } from "@/components/site/EmailButton";
import { AvatarIllustration } from "@/components/avatar/AvatarIllustration";
import { StatusScreen } from "./StatusScreen";

export interface ErrorScreenProps {
  /** Next's hash of the error, to match the server log. Never the error message. */
  digest?: string;
  onRetry: () => void;
  /** True in global-error, which replaces the whole document: no router, so plain links, and Email me as another way out. */
  standalone?: boolean;
}

const secondary =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 text-base font-medium transition-colors duration-150 hover:bg-bg-secondary";

// The shared error UI for error.tsx and global-error.tsx. It shows only fixed
// copy and the digest: error.message can hold internal detail, so it never
// reaches the page. Focus moves to the h1 when it appears so a keyboard or
// screen reader user lands on what happened, and again if a retry fails.
export function ErrorScreen({ digest, onRetry, standalone = false }: ErrorScreenProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <StatusScreen
      headingRef={heading}
      eyebrow="Service interrupted"
      title="This page hit a problem"
      lead="Something broke while loading it. Trying again usually fixes it."
      art={<AvatarIllustration pose="lost" size="lg" />}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-6 py-3.5 text-base font-medium text-text-inverse transition-colors duration-150 hover:bg-accent-primary-hover active:bg-accent-primary-active"
          >
            Try again
          </button>
          {standalone ? (
            // A plain link on purpose: a full page load is the cleanest way out of a broken document.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/" className={secondary}>
              Back to the start
            </a>
          ) : (
            <Link href="/" className={secondary}>
              Back to the start
            </Link>
          )}
          {standalone && <EmailButton size="lg" />}
        </div>
      }
    >
      {digest && (
        <p className="mt-6 font-mono text-sm text-text-tertiary">
          Reference: {digest}. Quote it if you email me.
        </p>
      )}
    </StatusScreen>
  );
}
