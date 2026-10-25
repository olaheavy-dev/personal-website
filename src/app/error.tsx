"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/system/ErrorScreen";
import { site } from "@/lib/site";

// Shown when a page throws while rendering. It sits inside the root layout, so
// the header and footer stay. `retry` re-fetches and re-renders the segment (the
// cause is often temporary); `reset` would only clear the error without
// refetching. Next's docs say to prefer retry.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Reporting is wired in #55; until then the console is the only record.
    console.error(error);
  }, [error]);

  const digest =
    error && typeof error === "object" && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

  return (
    <>
      {/* React hoists these into <head>. An error page is never worth indexing. */}
      <title>{`Something went wrong | ${site.name}`}</title>
      <meta name="robots" content="noindex" />
      <ErrorScreen digest={digest} onRetry={retry} />
    </>
  );
}
