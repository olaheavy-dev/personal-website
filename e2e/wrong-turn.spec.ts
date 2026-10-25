import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The 404 page (issue #22). Numbers in test names are the plan's acceptance
// criteria. /_lab/hidden exists only where LAB_PAGES=1 (Playwright's own server). It stands
// in for a page switched off by a feature flag: its flag is never set, so it is Off when the
// site is built and answers a static 404 (decision 0018).
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
  // The skip link must really move the keyboard into main, not just change the URL.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("main#main"))).toBe(true);
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

test("criterion 5: a hidden page is indistinguishable from a mistyped URL: Wrong turn title, noindex", async ({
  page,
  request,
}) => {
  test.skip(remote, "the lab page is off on remote sites");
  // A real 404 status, not a 200 with a 404 painted in (closes the caveat in #88).
  expect((await request.get("/_lab/hidden")).status()).toBe(404);
  const response = await page.goto("/_lab/hidden");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  // The hidden page's own title ("Hidden lab") must not leak.
  await expect(page).toHaveTitle("Wrong turn | Sunkanmi Olawuwo");
  // Every robots tag in the served HTML (Next adds one for the not found page, and streaming
  // another) says noindex, and there is at least one.
  const html = await (await request.get("/_lab/hidden")).text();
  const tags = html.match(/<meta name="robots" content="[^"]*"/g) ?? [];
  expect(tags.length).toBeGreaterThan(0);
  for (const tag of tags) expect(tag).toContain("noindex");
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
  // The site's focus ring is a two layer box shadow (--shadow-focus), not an outline,
  // and its outer layer is the focus colour token.
  const { ring, focusColour } = await home.evaluate((el) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-border-focus)";
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return { ring: getComputedStyle(el).boxShadow, focusColour: colour };
  });
  expect(ring).not.toBe("none");
  expect(ring).toContain(focusColour);
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

async function pushClientSide(page: Page, href: string) {
  await page.goto("/");
  await page.waitForFunction(() =>
    Boolean((window as unknown as { next?: { router?: unknown } }).next?.router),
  );
  await page.evaluate((target) => {
    (window as unknown as { __stayed: boolean }).__stayed = true;
    (window as unknown as { next: { router: { push: (href: string) => void } } }).next.router.push(target);
  }, href);
}

const stayedOnPage = (page: Page) =>
  page.evaluate(() => (window as unknown as { __stayed?: boolean }).__stayed === true);

test("criterion 12: an unknown URL answers with a full page load, which a screen reader announces itself", async ({
  page,
}) => {
  await pushClientSide(page, missing);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  await expect(page).toHaveTitle("Wrong turn | Sunkanmi Olawuwo");
  // Next does a hard navigation to a URL no route owns, so the document is new. If Next
  // ever starts navigating in place, this fails: then the route announcer must be
  // asserted here too, as the /_lab/hidden test below does.
  expect(await stayedOnPage(page)).toBe(false);
});

test("criterion 12b: a hidden page reached in place has its new title read by the route announcer", async ({
  page,
}) => {
  test.skip(remote, "the lab page is off on remote sites");
  await pushClientSide(page, "/_lab/hidden");
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  await expect(page).toHaveTitle("Wrong turn | Sunkanmi Olawuwo");
  expect(await stayedOnPage(page)).toBe(true);
  // The announcer reads the page's h1 when the title has not been swapped in yet.
  await expect(page.locator("#__next-route-announcer__")).toContainText(/wrong turn/i);
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
      return {
        running: running.map(
          (a) =>
            `${a.constructor.name}:${(a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName}:${(a.effect as KeyframeEffect).target?.className}`,
        ),
        pins,
        opacity: vehicle.opacity,
      };
    });
    expect(state.running).toEqual([]);
    expect(state.pins.every((scale) => scale === "none" || scale === "1")).toBe(true);
    expect(state.opacity).toBe("1");
  });
});

test.describe("layout", () => {
  test.use({ reducedMotion: "reduce" });
  for (const width of [360, 768, 1440]) {
    test(`avatar stands on the first stop, and nothing crowds it at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(missing);
      const box = async (selector: string) => (await page.locator(selector).first().boundingBox())!;
      const avatar = await box("[data-route-pin='here'] [data-avatar]");
      const herePin = await box("[data-route-pin='here']");
      const homePin = await box("[data-route-pin='home']");
      const workPin = await box("[data-route-pin='work']");
      const plane = await box("[data-route-leg] .route-plane");
      // The label's own text box (not its padded block), so the check is about glyphs.
      const text = await page.evaluate(() => {
        const label = document.querySelector("ol[aria-label='The way back'] li:first-child p")!;
        const range = document.createRange();
        range.selectNodeContents(label);
        const r = range.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      const rect = (b: { x: number; y: number; width: number; height: number }) => ({
        l: b.x,
        r: b.x + b.width,
        t: b.y,
        b: b.y + b.height,
      });
      const overlap = (a: ReturnType<typeof rect>, c: ReturnType<typeof rect>) =>
        a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
      // The avatar is centred on its pin, so the route's geometry is unchanged.
      expect(Math.abs(avatar.x + avatar.width / 2 - (herePin.x + herePin.width / 2))).toBeLessThan(1);
      expect(Math.abs(avatar.y + avatar.height / 2 - (herePin.y + herePin.height / 2))).toBeLessThan(1);
      // The avatar's left edge lines up with the page's text edge (the h1).
      const h1 = await box("h1");
      expect(Math.abs(avatar.x - h1.x)).toBeLessThan(6);
      // The plane sits clear of the avatar and of both stops.
      expect(overlap(rect(plane), rect(avatar))).toBe(false);
      expect(overlap(rect(plane), rect(homePin))).toBe(false);
      expect(overlap(rect(avatar), rect(homePin))).toBe(false);
      expect(overlap(rect(avatar), rect(workPin))).toBe(false);
      // The label never runs into the avatar.
      expect(overlap(rect(text), rect(avatar))).toBe(false);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  }
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
