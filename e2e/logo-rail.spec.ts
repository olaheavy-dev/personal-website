import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The logo rail on Home (#9, PR 1). Marks are CSS masks over a token colour; the names are
// text. Nothing in the rail moves, takes focus or links anywhere.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const rail = (page: Page) => page.locator("#shipped");
const markColour = (page: Page, slug: string) =>
  page
    .locator(`[data-logo-cell="${slug}"] .logo-mark`)
    .evaluate((el) => getComputedStyle(el).backgroundColor);

async function isDark(page: Page) {
  return page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches);
}

test.describe("logo rail", () => {
  test("names every company in text, in order, under one heading", async ({ page }) => {
    await page.goto("/");
    await expect(rail(page).getByRole("heading", { level: 2, name: "Where I've shipped" })).toBeVisible();
    const text = await rail(page).evaluate((el) => el.textContent ?? "");
    const order = ["HBK", "via", "Mukuru", "uLesson", "Optty", "Stanbic IBTC", "Access Bank", "Galooli"].map(
      (name) => text.indexOf(name),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("has no focusable element, and Tab never lands in it", async ({ page }) => {
    await page.goto("/");
    const focusable = await rail(page).evaluate(
      (el) =>
        el.querySelectorAll("a[href], button, input, select, textarea, [tabindex], [contenteditable]").length,
    );
    expect(focusable).toBe(0);
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest("#shipped"));
      expect(inside).toBe(false);
    }
  });

  test("draws every mark with a mask file served from public/", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/logos/") && !response.ok()) failed.push(response.url());
    });
    await page.goto("/");
    const marks = await rail(page)
      .locator("[data-logo]")
      .evaluateAll((els) =>
        els.map((el) => {
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return {
            logo: el.getAttribute("data-logo"),
            width: box.width,
            height: box.height,
            mask: style.maskImage,
          };
        }),
      );
    expect(marks).toHaveLength(8);
    for (const mark of marks) {
      expect(mark.width, mark.logo!).toBeGreaterThan(20);
      expect(mark.height, mark.logo!).toBeGreaterThan(5);
      expect(mark.mask, mark.logo!).toContain(`/logos/`);
    }
    expect(failed).toEqual([]);
  });

  test("changes colour on hover only where a pointer can hover", async ({ page }) => {
    await page.goto("/");
    const canHover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
    const rest = await markColour(page, "hbk");
    await page.locator('[data-logo-cell="hbk"]').hover();
    await page.waitForTimeout(400);
    const hovered = await markColour(page, "hbk");
    if (canHover) {
      // HBK's own colour from its logo file: teal blue in light, teal in dark.
      expect(hovered).toBe((await isDark(page)) ? "rgb(46, 163, 159)" : "rgb(0, 96, 126)");
      expect(hovered).not.toBe(rest);
    } else {
      expect(hovered).toBe(rest);
    }
  });

  test("Optty, whose file is white only, hovers to full ink", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.evaluate(() => matchMedia("(hover: hover)").matches)),
      "needs a pointer that hovers",
    );
    await page.locator('[data-logo-cell="optty"]').hover();
    await page.waitForTimeout(400);
    const dark = await isDark(page);
    expect(await markColour(page, "optty")).toBe(dark ? "rgb(237, 234, 242)" : "rgb(20, 20, 24)");
  });

  test("fades the hover colour normally, and not at all under reduced motion", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.evaluate(() => matchMedia("(hover: hover)").matches)),
      "needs a pointer that hovers",
    );
    const duration = () =>
      page
        .locator('[data-logo-cell="hbk"] .logo-mark')
        .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await duration()).toBeGreaterThan(0.1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Seconds. Under reduced motion the site's global rule makes every transition near instant.
    expect(await duration()).toBeLessThan(0.001);
    // The colour still changes: only the fade goes.
    await page.locator('[data-logo-cell="hbk"]').hover();
    expect(await markColour(page, "hbk")).not.toBe(await markColour(page, "galooli"));
  });

  test("keeps the logos visible under forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const colours = await rail(page)
      .locator(".logo-mark")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colours).toHaveLength(8);
    for (const colour of colours) {
      expect(colour).not.toBe(canvas);
      expect(colour).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  for (const width of [360, 375]) {
    test(`does not scroll sideways at ${width} px, and no logo touches an edge`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const edges = await rail(page)
        .locator("[data-logo]")
        .evaluateAll((els) =>
          els.map((el) => {
            const box = el.getBoundingClientRect();
            return { logo: el.getAttribute("data-logo"), left: box.left, right: box.right };
          }),
        );
      for (const edge of edges) {
        expect(edge.left, edge.logo!).toBeGreaterThanOrEqual(15);
        expect(edge.right, edge.logo!).toBeLessThanOrEqual(width - 15);
      }
    });
  }

  test("gives every logo a cell at least 44 px tall", async ({ page }) => {
    await page.goto("/");
    const heights = await rail(page)
      .locator("[data-logo-cell]")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights).toHaveLength(7);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  });

  test("keeps the Deimos group together and in one piece", async ({ page }) => {
    await page.goto("/");
    const group = await page.locator(".logo-group").boundingBox();
    const members = await page.locator(".logo-group-list [data-logo-cell]").evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    expect(members).toHaveLength(3);
    for (const member of members) {
      expect(member.left).toBeGreaterThanOrEqual(group!.x - 1);
      expect(member.right).toBeLessThanOrEqual(group!.x + group!.width + 1);
      expect(member.top).toBeGreaterThanOrEqual(group!.y - 1);
      expect(member.bottom).toBeLessThanOrEqual(group!.y + group!.height + 1);
    }
  });

  test("has no detectable accessibility violations, with a logo hovered", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    await page.locator('[data-logo-cell="galooli"]').hover();
    const results = await new AxeBuilder({ page }).include("#shipped").withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });
});
