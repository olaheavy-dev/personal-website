// Answers a real 404 for the developer demo pages (/_lab/...) unless LAB_PAGES=1.
// The page also refuses with notFound(), but with Cache Components that runs
// after the response has started streaming, so its status would still be 200.
// The proxy runs first, so the status is right. It matches only /_lab paths.
import { NextResponse, type NextRequest } from "next/server";
import { labPagesEnabled } from "@/lib/lab-pages";

export function proxy(request: NextRequest) {
  if (labPagesEnabled()) return NextResponse.next();
  // A path no route owns, so the site's own not found page is served with status 404.
  return NextResponse.rewrite(new URL("/not-found-lab-off", request.url));
}

export const config = { matcher: "/_lab/:path*" };
