import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("renders a single main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sunkanmi");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/");
    // Let the hero motion finish, so axe never reads a half-faded colour.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("does not scroll sideways", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("shows an email call to action in the first viewport", async ({ page }) => {
    await page.goto("/");
    // Header CTA on wider screens, hero CTA on phones: at least one is visible without scrolling.
    const visible = await page.getByRole("link", { name: /Email me/ }).evaluateAll((links) =>
      links.some((link) => {
        const box = link.getBoundingClientRect();
        return box.width > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
      }),
    );
    expect(visible).toBe(true);
  });

  test("theme toggle persists across reloads without a flash", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    await page.getByRole("button", { name: "Toggle colour theme" }).click();
    const after = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(after).not.toBe(before);

    await page.reload();
    // The saved theme is applied by an inline script before first paint.
    const reloaded = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(reloaded).toBe(after);
  });

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
  });

  test("scrolling top to bottom does not shift the layout (cumulative layout shift under 0.01)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= heightBefore; y += 200) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
    // The cause of #71: the sticky header used to shrink, making the page shorter as it scrolled.
    const heightAfter = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(heightAfter).toBe(heightBefore);
  });
});
