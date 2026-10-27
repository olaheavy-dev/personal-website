// Called by the Supabase Database Webhook when a row of `feature_flags` (or `stops`) changes, so a flag
// switch reaches every page on the next request (decision 0018, docs/flags.md), and a page
// that was in the middle of a rebuild at that moment within 5 seconds.
// POST only. The caller proves itself with `Authorization: Bearer <REVALIDATE_SECRET>`.
import { createHash, timingSafeEqual } from "node:crypto";
import { expireTag } from "@/lib/db/expire-tag";
import { createRateLimiter } from "@/lib/security/rate-limit";

// Only these tags can be refreshed from outside. Each maps a Supabase table name (what the
// webhook sends) to the cache tag, so a caller can never name an arbitrary tag.
const tableToTag: Record<string, string> = { feature_flags: "flags", stops: "stops" };
const allowedTags = new Set(Object.values(tableToTag));

// Counts failed attempts only, per address. A caller with the right secret is never limited,
// so a flood of wrong guesses from a shared address cannot starve the real webhook.
const allowFailure = createRateLimiter(30, 60_000);

// The address that failed attempts are counted against. The site is behind Caddy and not
// behind Cloudflare, so cf-connecting-ip is always supplied by the caller and is ignored.
// Without `trusted_proxies`, Caddy's reverse_proxy discards a client's X-Forwarded-For and
// sets it to the connecting address, so the header holds exactly one entry and the first
// one is the real one ("the proxy will ignore their values from incoming requests, to
// prevent spoofing": https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
// When #54 turns on the Cloudflare proxy, set Caddy `trusted_proxies` to Cloudflare's ranges,
// restrict the origin to Cloudflare, and only then read cf-connecting-ip here.
function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Compares two secrets without leaking where they first differ. */
function sameSecret(given: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return reply(503, { error: "Revalidation is not configured" });

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token || !sameSecret(token, secret)) {
    if (!allowFailure(clientAddress(request))) return reply(429, { error: "Too many requests" });
    return reply(401, { error: "Unauthorized" });
  }

  // The webhook body names the table; a direct call may send {"tag": "flags"} instead.
  const body: unknown = await request.json().catch(() => null);
  const named =
    body && typeof body === "object"
      ? ((body as { tag?: unknown }).tag ?? tableToTag[String((body as { table?: unknown }).table)])
      : undefined;
  if (typeof named !== "string" || !allowedTags.has(named)) {
    return reply(400, { error: "Unknown tag" });
  }

  // Expires the tag now and again 5 s later, for a page that was mid rebuild (src/lib/db/expire-tag.ts).
  expireTag(named);
  return reply(200, { revalidated: named });
}
