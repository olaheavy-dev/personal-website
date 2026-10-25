// The nonce branch for /admin (decision 0017). Built and tested now, but NOT called by
// src/proxy.ts yet: /admin does not exist. The "Admin shell + auth" task wires it in.
import { NextResponse, type NextRequest } from "next/server";
import { adminHeaders, buildCsp, createNonce } from "./headers";

/**
 * Continues the request with a fresh nonce. The nonce goes to the app on the request
 * (x-nonce, and the CSP itself so Next can stamp its own scripts) and the policy goes
 * to the browser on the response.
 */
export function adminResponse(
  request: NextRequest,
  { isDev = false, supabaseOrigin }: { isDev?: boolean; supabaseOrigin?: string } = {},
): NextResponse {
  const nonce = createNonce();
  const csp = buildCsp("admin", { nonce, isDev, supabaseOrigin });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const { key, value } of adminHeaders()) response.headers.set(key, value);
  return response;
}
