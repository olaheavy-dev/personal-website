import { expect, type APIRequestContext } from "@playwright/test";
import { defaultFlags, fakeUrl } from "./fake-constants.mjs";

// Helpers for the @flags journeys: change what the fake Supabase server answers, then ask the
// site to revalidate, exactly as the Supabase Database Webhook does in production.

export const revalidateSecret = "e2e-revalidate-secret";

export const allPages = ["page.work", "page.lab", "page.writing", "page.travel", "page.about"] as const;

/** The default flags with some pages switched off. */
export function flagsWithout(...off: string[]): Record<string, "on"> {
  return Object.fromEntries(Object.entries(defaultFlags).filter(([key]) => !off.includes(key)));
}

export async function control(
  request: APIRequestContext,
  body: { flags?: Record<string, string>; status?: number | null; reset?: boolean },
) {
  const response = await request.post(`${fakeUrl}/__control`, { data: body });
  expect(response.ok()).toBe(true);
  return (await response.json()) as { flags: Record<string, string>; status: number | null; reads: number };
}

/** Each scenario uses its own address, because /api/revalidate allows 30 requests a minute per address. */
export function revalidate(request: APIRequestContext, address = "203.0.113.1") {
  return request.post("/api/revalidate", {
    headers: { authorization: `Bearer ${revalidateSecret}`, "x-forwarded-for": address },
    data: { type: "UPDATE", table: "feature_flags", schema: "public" },
  });
}

/** Sets the flags, revalidates, and checks the site accepted it. */
export async function applyFlags(
  request: APIRequestContext,
  flags: Record<string, string>,
  address?: string,
) {
  await control(request, { flags, status: null });
  const response = await revalidate(request, address);
  expect(response.status()).toBe(200);
}

/** Puts the fake and the site back as the visual baselines and the other journeys expect. */
export async function resetFlags(request: APIRequestContext, address?: string) {
  await control(request, { reset: true });
  const response = await revalidate(request, address);
  expect(response.status()).toBe(200);
  // Rebuild the pages now, so the next test starts from today's pages.
  for (const path of ["/", "/work", "/lab", "/writing", "/travel", "/about", "/sitemap.xml"]) {
    expect((await request.get(path)).status()).toBe(200);
  }
}
