// Security headers for every response (issue #53, decision 0017). Pure functions, so the
// exact policies are unit tested. next.config.ts applies headerRules() to public pages
// and the API; src/proxy.ts will use buildCsp("admin") with a nonce once /admin exists.

export type CspKind = "page" | "admin" | "api";

export type CspOptions = {
  /** Required for the admin policy: a fresh nonce for every request. */
  nonce?: string;
  /** Development only: React needs eval there for debugging. Never in production. */
  isDev?: boolean;
  /** Origin of the Supabase project, for the admin policy (https and wss). */
  supabaseOrigin?: string;
};

export type HeaderEntry = { key: string; value: string };
export type HeaderRule = { source: string; headers: HeaderEntry[] };

const join = (directives: string[]) => directives.join("; ");

/** Content-Security-Policy value for one kind of response. */
export function buildCsp(kind: CspKind, { nonce, isDev = false, supabaseOrigin }: CspOptions = {}): string {
  if (kind === "api") return "default-src 'none'; frame-ancestors 'none'";

  if (kind === "admin") {
    if (!nonce) throw new Error("buildCsp(admin) needs a nonce");
    const origin = supabaseOrigin ? new URL(supabaseOrigin).origin : undefined;
    const socket = origin?.replace(/^https:/, "wss:");
    const evalPart = isDev ? " 'unsafe-eval'" : "";
    return join([
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${evalPart}`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: blob:${origin ? ` ${origin}` : ""}`,
      "font-src 'self'",
      `connect-src 'self'${origin ? ` ${origin} ${socket}` : ""}`,
      "media-src 'self'",
      "manifest-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ]);
  }

  // Public pages are prerendered, so they cannot carry a per request nonce. Next writes
  // its own inline scripts on static pages, hence 'unsafe-inline' for scripts. Everything
  // else is closed down to this origin. See decision 0017 for the reasoning.
  return join([
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]);
}

/** A fresh, unguessable nonce: 128 random bits, base64 encoded. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "browsing-topics=()",
  "fullscreen=(self)",
].join(", ");

/** Headers every response carries, whatever its kind. */
export function baseHeaders(): HeaderEntry[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: permissionsPolicy },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // One year. No includeSubDomains and no preload: both are separate decisions (0017).
    { key: "Strict-Transport-Security", value: "max-age=31536000" },
  ];
}

/** Extra headers for admin responses, set by the proxy together with the nonce policy. */
export function adminHeaders(): HeaderEntry[] {
  return [
    { key: "Cache-Control", value: "no-store" },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
}

const apiHeaders = (): HeaderEntry[] => [
  { key: "Content-Security-Policy", value: buildCsp("api") },
  { key: "Cache-Control", value: "no-store" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

/**
 * Rules for next.config.ts headers(). Each path gets exactly one CSP: the API policy for
 * /api/* and /healthz, the page policy everywhere else. When /admin exists it moves to the
 * proxy (nonce policy), and the page rule must then skip it.
 */
export function headerRules(): HeaderRule[] {
  const isDev = process.env.NODE_ENV === "development";
  return [
    { source: "/:path*", headers: baseHeaders() },
    {
      source: "/((?!api(?:/|$)|healthz$).*)",
      headers: [{ key: "Content-Security-Policy", value: buildCsp("page", { isDev }) }],
    },
    { source: "/api/:path*", headers: apiHeaders() },
    { source: "/healthz", headers: apiHeaders() },
  ];
}
