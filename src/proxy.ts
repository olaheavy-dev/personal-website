// Two jobs, both cheap (no data reads, no flags):
//
// 1. /_lab/... (developer demo pages) answers a real 404 unless LAB_PAGES=1. The page also
//    refuses with notFound(), but with Cache Components that runs after the response has
//    started streaming, so its status would still be 200.
// 2. Every address no route owns is rewritten to one fixed path, so the 404 is always
//    rendered for the same path. The 404 reads the flags (for its way back), which makes it a
//    cache entry that Next rebuilds after each flags revalidation; rebuilt for a visitor's own
//    address, it would store that address in the page and serve it to everyone. Under one
//    fixed path the cached page can never contain a visitor's URL (decision 0018).
//
// The matcher must be a constant. It runs for every path except: _next, api, healthz, files
// with an extension (favicon.ico, images, sitemap.xml), and the routes that exist: Home and
// the flagged pages. Keep that list in step with src/lib/flags/registry.ts (proxy.test.ts
// fails if they drift).
import { NextResponse, type NextRequest } from "next/server";
import { labPagesEnabled } from "@/lib/lab-pages";

/** A path no route owns, so the site's own not found page is served with status 404. */
export const unmatchedPath = "/not-found-unmatched";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/_lab/") && labPagesEnabled()) return NextResponse.next();
  return NextResponse.rewrite(new URL(unmatchedPath, request.url));
}

export const config = {
  matcher: [
    "/((?!_next/|api/|healthz$|not-found-unmatched$|.*\\..*|work$|lab$|writing$|travel$|about$|$).*)",
  ],
};
