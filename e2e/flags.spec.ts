import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultFlags, fakeUrl } from "./fixtures/fake-constants.mjs";
import {
  allPages,
  applyFlags,
  control,
  flagsWithout,
  resetFlags,
  revalidate,
  revalidateSecret,
} from "./fixtures/flags";

// Feature flags end to end (issue #6). These change the answer of the fake Supabase server and
// ask the site to revalidate, so they share state: `make e2e-flags` runs them one at a time,
// and `make e2e` leaves them out. They cannot run against a live site (no fake to control).
const remote = Boolean(process.env.E2E_BASE_URL);
const wrongTurn = "Wrong turn | Sunkanmi Olawuwo";
const axeTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.describe.configure({ mode: "serial" });
test.skip(remote, "the flag journeys need the fake Supabase server");

test.afterAll(async ({ request }) => {
  await resetFlags(request, "203.0.113.99");
});

async function navLabels(page: Page) {
  const nav = page.getByRole("navigation", { name: "Main" });
  return nav.getByRole("link").allTextContents();
}

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function sitemapPaths(request: Parameters<typeof revalidate>[0]) {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>https:\/\/olaheavy\.dev([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
}

test("@flags the fake serves today's flags, so every page is on", async ({ page, request }) => {
  await resetFlags(request);
  for (const path of ["/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/lab", "/writing", "/travel", "/about"]);
  await page.goto("/");
  if (!(await page.getByRole("button", { name: "Menu" }).isVisible())) {
    expect(await navLabels(page)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
  }
});

test("@flags Off gives the Wrong turn 404 after one revalidation, and the page disappears everywhere", async ({
  page,
  request,
}, testInfo) => {
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.2");

  // The very next GET is the 404: a real status, the Wrong turn title and noindex.
  const response = await page.goto("/lab");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(wrongTurn);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  const html = await (await request.get("/lab")).text();
  expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
  // The hidden page's own title never leaks into the 404.
  expect(html).not.toContain("Lab | Sunkanmi");

  // Hidden in the navigation: the desktop pill, and the mobile menu.
  await page.goto("/");
  if (testInfo.project.name === "small-phone") {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  expect(await navLabels(page)).toEqual(["Work", "Writing", "Travel", "About"]);
  // No link to it is left anywhere in the page.
  await expect(page.locator('a[href="/lab"]')).toHaveCount(0);
  const home = await (await request.get("/")).text();
  expect(home).not.toContain('href="/lab"');

  // Hidden in the sitemap.
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/writing", "/travel", "/about"]);
  // The other pages are untouched.
  expect((await request.get("/work")).status()).toBe(200);
});

test("@flags a hidden page answers like a mistyped URL: same status and robots header, nothing of its own", async ({
  request,
}) => {
  // Not byte for byte: a hidden page is Next's static error shell (no lang, drawn in the
  // browser), an unknown address is the prerendered 404. What must match is what a crawler or
  // a visitor can tell: the status, the robots header, and no title or text from the page.
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.3");
  const hidden = await request.get("/lab");
  const mistyped = await request.get("/this-page-does-not-exist");
  expect(hidden.status()).toBe(mistyped.status());
  expect(hidden.headers()["x-robots-tag"]).toBe(mistyped.headers()["x-robots-tag"]);
  const html = await hidden.text();
  expect(html).not.toContain("Things I build to learn");
  expect(html).not.toContain("Lab | Sunkanmi");
  expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
});

test("@flags after a revalidation the 404 never holds a visitor's address", async ({ request }) => {
  // The 404 reads the flags, so it is rebuilt after each revalidation. Without the proxy's one
  // fixed path it would be rebuilt for whichever address came first and then served to all.
  // So each kind of address goes first right after its own revalidation, then a clean address
  // follows, and neither response may hold any requested path.
  const first = [
    "/first-missing-aaa",
    "/missing/person@example.com",
    "/missing-dotted.html",
    "/api/nope-api",
    "/_next/nope-next",
    "/logos/nope-logo.svg",
  ];
  for (const path of first) {
    await applyFlags(request, flagsWithout("page.lab"), "203.0.113.14");
    const one = await request.get(path);
    const two = await request.get("/follow-up-missing-zzz/deeper");
    for (const response of [one, two]) {
      expect(response.status(), path).toBe(404);
      const body = await response.text();
      for (const word of [
        "first-missing",
        "person@example",
        "missing-dotted",
        "nope-api",
        "nope-next",
        "nope-logo",
        "follow-up-missing",
      ]) {
        expect(body, `${path} leaked ${word}`).not.toContain(word);
      }
    }
  }
  // An unknown API address keeps the API policy, not the page policy.
  const api = await request.get("/api/nope-api");
  expect(api.headers()["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'");
});

test("@flags a switched on page comes back after one revalidation", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.travel"), "203.0.113.4");
  expect((await request.get("/travel")).status()).toBe(404);
  await applyFlags(request, defaultFlags, "203.0.113.4");
  const response = await page.goto("/travel");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/^Travel \|/);
});

test("@flags Preview is treated as Off until Auth: no page, no link, no sitemap entry", async ({
  request,
}) => {
  // The public role never receives a Preview row (row level security), so the fake leaves it
  // out as Supabase does; the visibility rule also hides it from the public viewer.
  await control(request, { flags: { ...flagsWithout("page.about"), "page.about": "preview" }, status: null });
  expect((await revalidate(request, "203.0.113.5")).status()).toBe(200);
  expect((await request.get("/about")).status()).toBe(404);
  expect(await sitemapPaths(request)).not.toContain("/about");
});

test("@flags the 404's way back drops Work when Work is hidden", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.work"), "203.0.113.6");
  await page.goto("/this-page-does-not-exist");
  const way = page.getByRole("list", { name: "The way back" });
  await expect(way.getByRole("link")).toHaveCount(1);
  await expect(way.getByRole("link", { name: /Home/ })).toBeVisible();
  await expect(way.getByRole("link", { name: /Work/ })).toHaveCount(0);
  // A hidden page shows the same way back.
  await page.goto("/work");
  await expect(page.getByRole("list", { name: "The way back" }).getByRole("link")).toHaveCount(1);
});

test("@flags with every page off the header is still usable: no empty nav, no Menu button", async ({
  page,
  request,
}) => {
  await applyFlags(request, flagsWithout(...allPages), "203.0.113.7");
  for (const width of [1440, 375, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.locator("header nav")).toHaveCount(0);
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /Sunkanmi/ }).first()).toBeVisible();
    await expect(header.getByRole("button", { name: /theme/i })).toBeVisible();
    await expect(header.getByRole("link", { name: "Email me" }).filter({ visible: true })).toHaveCount(1);
    expect(await overflow(page), `${width}px`).toBeLessThanOrEqual(0);
  }
  expect(await sitemapPaths(request)).toEqual(["/"]);
  for (const path of ["/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("list", { name: "The way back" }).getByRole("link")).toHaveCount(1);
});

test("@flags with items off there is no sideways scroll at 375 and 360", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.work", "page.lab"), "203.0.113.8");
  for (const width of [375, 360]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/writing", "/this-page-does-not-exist"]) {
      await page.goto(path);
      expect(await overflow(page), `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("@flags keyboard order skips hidden items, and the pill indicator sits under the current one", async ({
  page,
  request,
}, testInfo) => {
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.9");
  await page.goto("/writing");

  if (testInfo.project.name === "small-phone") {
    // Phone: the brand, then the Menu button; its panel lists the visible items in order.
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /Sunkanmi/ }).first()).toBeFocused();
    await page.getByRole("button", { name: "Menu" }).click();
    expect(await navLabels(page)).toEqual(["Work", "Writing", "Travel", "About"]);
    return;
  }

  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // brand
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Work", "Writing", "Travel", "About"]) {
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: label })).toBeFocused();
  }
  // The lilac indicator sits under Writing, the current page.
  const indicator = nav.locator("li[aria-hidden=true]");
  await expect(async () => {
    const marker = await indicator.boundingBox();
    const link = await nav.getByRole("link", { name: "Writing" }).boundingBox();
    expect(marker).not.toBeNull();
    expect(Math.abs(marker!.x - link!.x)).toBeLessThan(8);
    expect(Math.abs(marker!.width - link!.width)).toBeLessThan(8);
  }).toPass();
});

test("@flags the header and the 404 pass axe in light and dark with items off", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.lab", "page.travel"), "203.0.113.10");
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const path of ["/", "/lab", "/this-page-does-not-exist"]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
      expect(results.violations, `${path} ${colorScheme}`).toEqual([]);
    }
  }
});

test.describe("javascript off", () => {
  test.use({ javaScriptEnabled: false });

  test("@flags the server HTML already leaves the hidden item out, and a hidden URL is still a 404", async ({
    page,
    request,
  }) => {
    await applyFlags(request, flagsWithout("page.lab"), "203.0.113.11");
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).not.toContain('href="/lab"');
    expect(html).toContain('href="/work"');
    expect((await request.get("/lab")).status()).toBe(404);
  });
});

test("@flags a failed read during a revalidation keeps the last good pages, with status 200", async ({
  page,
  request,
}) => {
  // A good read first (resetFlags visits every page), so this process holds a last good set.
  await resetFlags(request, "203.0.113.12");
  await control(request, { status: 500, flags: flagsWithout("page.work") });
  const response = await revalidate(request, "203.0.113.12");
  expect(response.status()).toBe(200);

  for (const path of ["/", "/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/lab", "/writing", "/travel", "/about"]);
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The read is retried within a minute: once Supabase is back the site follows it.
  await control(request, { status: null });
  const again = await revalidate(request, "203.0.113.12");
  expect(again.status()).toBe(200);
  expect((await request.get("/work")).status()).toBe(404);
});

test("@flags /api/revalidate refuses the wrong caller", async ({ request }) => {
  const address = "203.0.113.13";
  const base = { "x-forwarded-for": address };
  const body = { type: "UPDATE", table: "feature_flags" };
  expect((await request.post("/api/revalidate", { headers: base, data: body })).status()).toBe(401);
  expect(
    (
      await request.post("/api/revalidate", {
        headers: { ...base, authorization: "Bearer not-the-secret" },
        data: body,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/revalidate", {
        headers: { ...base, authorization: `Bearer ${revalidateSecret}` },
        data: { table: "settings" },
      })
    ).status(),
  ).toBe(400);
  expect((await request.get("/api/revalidate", { headers: base })).status()).toBe(405);
  expect((await request.put("/api/revalidate", { headers: base, data: body })).status()).toBe(405);
});

test("@flags /api/revalidate allows 30 wrong attempts a minute from one address, then 429, and never limits the right secret", async ({
  request,
}, testInfo) => {
  // One address per project, because the window is a minute and the projects run back to back.
  const own = `203.0.114.${testInfo.project.name.length}`;
  const wrong = () =>
    request.post("/api/revalidate", {
      headers: { authorization: "Bearer not-the-secret", "x-forwarded-for": own },
      data: { tag: "flags" },
    });
  const statuses: number[] = [];
  for (let i = 0; i < 32; i++) statuses.push((await wrong()).status());
  expect(statuses.slice(0, 30).every((status) => status === 401)).toBe(true);
  expect(statuses.slice(30)).toEqual([429, 429]);
  // The right secret from the same address still works, and another address is unaffected.
  expect((await revalidate(request, own)).status()).toBe(200);
  expect((await revalidate(request, "203.0.113.201")).status()).toBe(200);
});

test("@flags the fake leaves the site as it found it", async ({ request }) => {
  await resetFlags(request, "203.0.113.202");
  const state = await (await request.get(`${fakeUrl}/__control`)).json();
  expect(state.flags).toEqual(defaultFlags);
});

test("@flags the fake content server answers empty or with an error on request, and is reset afterwards", async ({
  request,
}) => {
  const post = (data: object) => request.post(`${fakeUrl}/__control`, { data });
  try {
    expect((await (await request.get(`${fakeUrl}/rest/v1/stops`)).json()).length).toBe(7);
    await post({ content: "empty" });
    expect(await (await request.get(`${fakeUrl}/rest/v1/stops`)).json()).toEqual([]);
    await post({ content: "error" });
    expect((await request.get(`${fakeUrl}/rest/v1/lab_projects`)).status()).toBe(500);
  } finally {
    await post({ reset: true });
  }
  expect((await request.get(`${fakeUrl}/rest/v1/lab_projects`)).status()).toBe(200);
});
