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
// The matcher must be a constant. The proxy skips only what exists or is handled elsewhere:
// built assets (_next/static, _next/image), the endpoints /api/revalidate, /healthz and
// /sitemap.xml, the favicon, each file in public/ by name, the fixed path itself, Home and the
// flagged pages. Everything else, dotted addresses, unknown /api/* and unknown /_next/* paths
// included, is rewritten. proxy.test.ts fails if public/ gains a file that is not listed here
// or the registry gains a page that is not.
import { NextResponse, type NextRequest } from "next/server";
import { labPagesEnabled } from "@/lib/lab-pages";

/** A path no route owns, so the site's own not found page is served with status 404. */
export const unmatchedPath = "/not-found-unmatched";
/**
 * The same for an unknown /api address. The security header rules are matched against the
 * rewritten path, so it must stay under /api to keep the API policy (default-src 'none').
 */
export const unmatchedApiPath = "/api/not-found-unmatched";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/_lab/") && labPagesEnabled()) return NextResponse.next();
  const target = request.nextUrl.pathname.startsWith("/api/") ? unmatchedApiPath : unmatchedPath;
  return NextResponse.rewrite(new URL(target, request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static/|_next/image$|api/revalidate$|api/not-found-unmatched$|healthz$|sitemap\\.xml$|favicon\\.ico$|images/sunkanmi-256\\.jpg$|logos/(?:access-bank|deimos|galooli|hbk|mukuru|optty|stanbic-ibtc-mono|stanbic-ibtc|ulesson-mono|ulesson)\\.svg$|logos/tools/(?:csharp|fastapi|github|microsoft-agent-framework|nextjs|playwright|pytest|python|qdrant|react|redis|terraform|typescript)\\.svg$|not-found-unmatched$|work$|lab$|writing$|travel$|about$|$).*)",
  ],
};
