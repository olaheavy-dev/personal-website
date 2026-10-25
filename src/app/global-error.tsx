"use client";

import { useLayoutEffect } from "react";
import { ErrorScreen } from "@/components/system/ErrorScreen";
import { site } from "@/lib/site";
import { applySavedTheme, themeScript } from "@/lib/theme-script";
import { fontVariables } from "./fonts";
import "./globals.css";

// Shown when the root layout itself throws. It replaces the whole document, so it
// brings its own <html> and <body>, the global stylesheet, the fonts and the same
// theme script as the layout (the saved theme applies before first paint). No
// header or footer: they are what broke, so Email me is the other way out. It
// loads nothing from another origin, so a strict content security policy (#86)
// allows it.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  // The script below covers a server rendered load; when this replaces a page already
  // on screen, the script is not run again, so apply the saved theme before paint.
  useLayoutEffect(applySavedTheme, []);
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
        <ErrorScreen digest={digest} onRetry={retry} standalone />
      </body>
    </html>
  );
}
