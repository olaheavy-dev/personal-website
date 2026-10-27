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
  body: { flags?: Record<string, string>; status?: number | null; reset?: boolean; delay?: number },
) {
  const response = await request.post(`${fakeUrl}/__control`, { data: body });
  expect(response.ok()).toBe(true);
  return (await response.json()) as {
    flags: Record<string, string>;
    status: number | null;
    reads: number;
    delay: number;
  };
}

/** Each scenario uses its own address, because /api/revalidate allows 30 requests a minute per address. */
export function revalidate(request: APIRequestContext, address = "203.0.113.1") {
  return request.post("/api/revalidate", {
    headers: { authorization: `Bearer ${revalidateSecret}`, "x-forwarded-for": address },
    data: { type: "UPDATE", table: "feature_flags", schema: "public" },
  });
}

/**
 * Waits until a path answers `expected`. A page whose render began before a revalidation and ended
 * after it keeps its old answer until the route's second revalidation, 5 s later (src/app/api/
 * revalidate/route.ts, docs/flags.md), and the previous test's browser leaves such renders behind,
 * so no test may assume the very next request is already right. 15 s is that pause plus a slow render.
 */
export async function expectStatus(request: APIRequestContext, path: string, expected: number) {
  await expect
    .poll(async () => (await request.get(path)).status(), {
      message: `${path} should answer ${expected}`,
      timeout: 15_000,
    })
    .toBe(expected);
}

/** Sets the flags, revalidates, checks the site accepted it, and waits until every page shows them. */
export async function applyFlags(
  request: APIRequestContext,
  flags: Record<string, string>,
  address?: string,
) {
  await control(request, { flags, status: null });
  const response = await revalidate(request, address);
  expect(response.status()).toBe(200);
  const paths = {
    "page.work": "/work",
    "page.lab": "/lab",
    "page.writing": "/writing",
    "page.travel": "/travel",
    "page.about": "/about",
  };
  for (const [key, path] of Object.entries(paths)) {
    await expectStatus(request, path, flags[key] === "on" ? 200 : 404);
  }
  // The sitemap and the home page's navigation are rebuilt pages too, with the same exposure.
  const shown = Object.entries(paths)
    .filter(([key]) => flags[key] === "on")
    .map(([, path]) => path);
  await expect
    .poll(
      async () => {
        const sitemap = await (await request.get("/sitemap.xml")).text();
        const home = await (await request.get("/")).text();
        return Object.values(paths).map(
          (path) =>
            sitemap.includes(`olaheavy.dev${path}<`) === shown.includes(path) &&
            home.includes(`href="${path}"`) === shown.includes(path),
        );
      },
      { message: "the sitemap and the home navigation should show the new flags", timeout: 15_000 },
    )
    .toEqual(Object.values(paths).map(() => true));
}

/** Puts the fake and the site back as the visual baselines and the other journeys expect. */
export async function resetFlags(request: APIRequestContext, address?: string) {
  await control(request, { reset: true });
  const response = await revalidate(request, address);
  expect(response.status()).toBe(200);
  // Rebuild the pages now, so the next test starts from today's pages.
  for (const path of ["/", "/work", "/lab", "/writing", "/travel", "/about", "/sitemap.xml"]) {
    await expectStatus(request, path, 200);
  }
}
