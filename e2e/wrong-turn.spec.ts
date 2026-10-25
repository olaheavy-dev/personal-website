import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The 404 page (issue #22). Numbers in test names are the plan's acceptance
// criteria. /_lab/hidden exists only where LAB_PAGES=1 (Playwright's own server).
const remote = Boolean(process.env.E2E_BASE_URL);
const missing = "/this-page-does-not-exist";
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

// Wait for every finite animation (the route drawing) to end.
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => null)),
    ),
  );
}

// Every robots meta on the page, joined. A page that calls notFound() can carry its
// own as well as the 404's, and any one of them saying noindex is enough.
async function robots(page: Page) {
  const all = await page
    .locator("meta[name='robots']")
    .evaluateAll((metas) => metas.map((m) => m.getAttribute("content")));
  return all.join(",");
}

test("criterion 1: unknown URLs answer 404", async ({ request }) => {
  expect((await request.get(missing)).status()).toBe(404);
  expect((await request.get("/work/nope")).status()).toBe(404);
});

test("criterion 2: the title is Wrong turn and the page is noindex", async ({ page }) => {
  await page.goto(missing);
  await expect(page).toHaveTitle("Wrong turn | Sunkanmi Olawuwo");
  expect(await robots(page)).toContain("noindex");
});

test("criterion 3: one h1 and main#main, and the skip link lands on it", async ({ page }) => {
  await page.goto(missing);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("criterion 4: the requested path is never repeated, and nothing says coming soon or preview", async ({
  request,
}) => {
  const html = await (await request.get(missing)).text();
  expect(html).not.toContain("this-page-does-not-exist");
  expect(html).not.toMatch(/coming soon|preview/i);
  const nested = await (await request.get("/work/nope?secret=1")).text();
  expect(nested).not.toContain("nope");
  expect(nested).not.toContain("secret");
});

test("criterion 5: a page that calls notFound() after streaming shows the same page, noindex", async ({
  page,
}) => {
  test.skip(remote, "the lab page is off on remote sites");
  await page.goto("/_lab/hidden");
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  expect(await robots(page)).toContain("noindex");
});

test("criterion 8: Home and Work are real links at least 44 px tall, with a visible focus ring", async ({
  page,
}) => {
  await page.goto(missing);
  const way = page.getByRole("list", { name: "The way back" });
  for (const [name, href] of [
    ["Home", "/"],
    ["Work", "/work"],
  ] as const) {
    const link = way.getByRole("link", { name: new RegExp(name) });
    await expect(link).toHaveAttribute("href", href);
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  const home = way.getByRole("link", { name: /Home/ });
  await expect(home).toBeFocused();
  // The site's focus ring is a two layer box shadow (--shadow-focus), not an outline.
  const ring = await home.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).not.toBe("none");
});

test("criterion 9: Tab goes from the skip link to Home, then Work, then the footer", async ({ page }) => {
  await page.goto(missing);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter"); // skip link: focus continues from main
  const way = page.getByRole("list", { name: "The way back" });
  await page.keyboard.press("Tab");
  await expect(way.getByRole("link", { name: /Home/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(way.getByRole("link", { name: /Work/ })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest("footer, section[aria-labelledby='next-stop-title']"),
    ),
  ).toBe(true);
});

test("criterion 11: no nav item is marked current on a top level unknown URL", async ({ page }) => {
  await page.goto(missing);
  await expect(page.locator("header [aria-current]")).toHaveCount(0);
});

test("criterion 12: after a client navigation to an unknown URL, the title is announced", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() =>
    Boolean((window as unknown as { next?: { router?: unknown } }).next?.router),
  );
  await page.evaluate(() => {
    (window as unknown as { __stayed: boolean }).__stayed = true;
    (window as unknown as { next: { router: { push: (href: string) => void } } }).next.router.push(
      "/this-page-does-not-exist",
    );
  });
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  await expect(page).toHaveTitle("Wrong turn | Sunkanmi Olawuwo");
  // Next answers an unknown URL with a full page load, which a screen reader announces
  // itself. Should it ever navigate in place, the route announcer must read the title.
  const stayed = await page.evaluate(() => (window as unknown as { __stayed?: boolean }).__stayed === true);
  if (stayed) {
    await expect(page.locator("#__next-route-announcer__")).toContainText("Wrong turn");
  }
});

test("criterion 13: passes axe once the route settles", async ({ page }) => {
  await page.goto(missing);
  await page.locator("[data-route]").scrollIntoViewIfNeeded();
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(results.violations).toEqual([]);
});

for (const width of [360, 375]) {
  test(`criterion 14: no sideways scroll at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(missing);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await settle(page);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("criterion 15: the route is finished on load, with no running animation and the plane at rest", async ({
    page,
  }) => {
    await page.goto(missing);
    const state = await page.evaluate(() => {
      const route = document.querySelector("[data-route]")!;
      const running = route.getAnimations({ subtree: true }).filter((a) => a.playState === "running");
      const pins = Array.from(route.querySelectorAll("[data-route-pin]")).map(
        (p) => getComputedStyle(p).scale,
      );
      const vehicle = getComputedStyle(route.querySelector(".route-vehicle")!);
      return { running: running.length, pins, opacity: vehicle.opacity };
    });
    expect(state.running).toBe(0);
    expect(state.pins.every((scale) => scale === "none" || scale === "1")).toBe(true);
    expect(state.opacity).toBe("1");
  });
});

test.describe("javascript off", () => {
  test.use({ javaScriptEnabled: false });
  test("criterion 16: the h1, the links and a finished route all show", async ({ page }) => {
    await page.goto(missing);
    await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
    const way = page.getByRole("list", { name: "The way back" });
    await expect(way.getByRole("link", { name: /Home/ })).toHaveAttribute("href", "/");
    await expect(way.getByRole("link", { name: /Work/ })).toHaveAttribute("href", "/work");
    const scale = await page
      .locator("[data-route-pin]")
      .first()
      .evaluate((pin) => getComputedStyle(pin).scale);
    expect(scale === "none" || scale === "1").toBe(true);
  });
});
