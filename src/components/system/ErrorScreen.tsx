"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BackArrow, errorCopy, primaryButton, referenceLine, secondaryButton } from "./error-parts";
import { StatusScreen } from "./StatusScreen";

export interface ErrorScreenProps {
  /** Next's hash of the error, to match the server log. Never the error message. */
  digest?: string;
  onRetry: () => void;
}

// The error UI for error.tsx. It shows only fixed copy and the digest:
// error.message can hold internal detail, so it never reaches the page. Focus
// moves to the h1 when it appears so a keyboard or screen reader user lands on
// what happened, and again if a retry fails. It has no art: a service error is
// not the visitor being lost, so the avatar stays with the 404.
export function ErrorScreen({ digest, onRetry }: ErrorScreenProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <StatusScreen
      headingRef={heading}
      eyebrow={errorCopy.eyebrow}
      title={errorCopy.title}
      lead={errorCopy.lead}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onRetry} className={primaryButton}>
            {errorCopy.retry}
          </button>
          <Link href="/" className={secondaryButton}>
            <BackArrow />
            {errorCopy.home}
          </Link>
        </div>
      }
    >
      {digest && <p className="mt-6 font-mono text-sm text-text-tertiary">{referenceLine(digest)}</p>}
    </StatusScreen>
  );
}
