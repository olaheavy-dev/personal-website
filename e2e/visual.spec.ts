import { expect, test } from "@playwright/test";

// Visual regression (issue #60). Baselines exist only for Linux, made inside the
// Playwright container that CI uses, because font rendering differs by platform.
// Run with `make visual`; accept changes with `make visual-accept RUN=<id>`.
// `/work` stands in for the four coming soon pages, which share one layout.
const routes = [
  { name: "home", path: "/" },
  { name: "work", path: "/work" },
];

test.describe("visual @visual", () => {
  test.use({ reducedMotion: "reduce" });

  for (const route of routes) {
    test(`${route.name} looks the same`, async ({ page }) => {
      await page.goto(route.path);
      await page.evaluate(() => document.fonts.ready);
      // Load every image now (lazy ones below the fold would otherwise never start)
      // and wait for them, so none can arrive mid screenshot.
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images).map((img) => {
            img.loading = "eager";
            return img.complete ? undefined : new Promise((done) => (img.onload = img.onerror = done));
          }),
        ),
      );
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        animations: "disabled",
        mask: [page.locator("[data-visual-mask]")],
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
