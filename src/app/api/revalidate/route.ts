// Called by the Supabase Database Webhook when a row of `feature_flags` changes, so a flag
// switch reaches every page within a second or two (decision 0018, docs/database.md).
// POST only. The caller proves itself with `Authorization: Bearer <REVALIDATE_SECRET>`.
import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { createRateLimiter } from "@/lib/security/rate-limit";

// Only these tags can be refreshed from outside. Each maps a Supabase table name (what the
// webhook sends) to the cache tag, so a caller can never name an arbitrary tag.
const tableToTag: Record<string, string> = { feature_flags: "flags" };
const allowedTags = new Set(Object.values(tableToTag));

const allow = createRateLimiter(30, 60_000);

function clientAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Compares two secrets without leaking where they first differ. */
function sameSecret(given: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!allow(clientAddress(request))) return reply(429, { error: "Too many requests" });

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return reply(503, { error: "Revalidation is not configured" });

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token || !sameSecret(token, secret)) return reply(401, { error: "Unauthorized" });

  // The webhook body names the table; a direct call may send {"tag": "flags"} instead.
  const body: unknown = await request.json().catch(() => null);
  const named =
    body && typeof body === "object"
      ? ((body as { tag?: unknown }).tag ?? tableToTag[String((body as { table?: unknown }).table)])
      : undefined;
  if (typeof named !== "string" || !allowedTags.has(named)) {
    return reply(400, { error: "Unknown tag" });
  }

  // { expire: 0 }: stale pages are never served after this, so the next request rebuilds.
  revalidateTag(named, { expire: 0 });
  return reply(200, { revalidated: named });
}
