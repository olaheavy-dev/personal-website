"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  BackArrow,
  errorCopy,
  primaryButton,
  referenceLine,
  secondaryButton,
} from "@/components/system/error-parts";
import { site } from "@/lib/site";
import { applySavedTheme, themeScript } from "@/lib/theme-script";
import { fontVariables } from "./fonts";
import "./globals.css";

// Shown when the root layout itself throws. It replaces the whole document, so it
// brings its own <html> and <body>, the global stylesheet, the fonts and the same
// theme script as the layout. It is deliberately small and built apart from
// ErrorScreen (no avatar, no EmailButton), because Next loads this file on every
// page: a small chunk keeps every page light. There is no header or footer (they
// are what broke), so a quiet brand line gives it an identity and Email me is the
// other way out. It loads nothing from another origin, so a strict content security
// policy (#86) allows it.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  // The script below covers a server rendered load; when this replaces a page already
  // on screen, the script is not run again, so apply the saved theme before paint.
  useLayoutEffect(applySavedTheme, []);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const digest =
    error && typeof error === "object" && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <title>{`Something went wrong | ${site.name}`}</title>
        <meta name="robots" content="noindex" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <main
          id="main"
          className="mx-auto w-full max-w-wide px-(--gutter) pt-10 pb-8 md:pt-16"
          aria-labelledby="status-title"
        >
          <p className="font-display text-lg tracking-tight text-text-secondary">{site.name}</p>
          <h1
            id="status-title"
            ref={heading}
            tabIndex={-1}
            className="mt-6 max-w-(--max-width-content) text-display-lg leading-display focus-visible:rounded-none focus-visible:shadow-none"
          >
            {errorCopy.title}
          </h1>
          <p className="mt-5 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">
            {errorCopy.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={retry} className={primaryButton}>
              {errorCopy.retry}
            </button>
            {/* A plain link on purpose: a full page load is the cleanest way out of a broken document. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={secondaryButton}>
              <BackArrow />
              {errorCopy.home}
            </a>
            {/* A plain mailto link, not EmailButton: this runs outside the ToastProvider, so there is
                no "Email copied" toast here, but the mail app still opens. */}
            <a href={`mailto:${site.email}`} className={secondaryButton}>
              Email me
            </a>
          </div>
          {digest && <p className="mt-6 font-mono text-sm text-text-tertiary">{referenceLine(digest)}</p>}
        </main>
      </body>
    </html>
  );
}
