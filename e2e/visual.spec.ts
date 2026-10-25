import { expect, test } from "@playwright/test";

// Visual regression (issue #60). Baselines exist only for Linux, made inside the
// Playwright container that CI uses, because font rendering differs by platform.
// Run with `make visual`; accept changes with `make visual-accept RUN=<id>`.
// `/work` stands in for the four coming soon pages, which share one layout.
// Every width is captured in both themes, so the desktop-dark project is
// skipped here: desktop-light already covers dark at desktop width.
const themes = ["light", "dark"] as const;
const routes = [
  { name: "home", path: "/" },
  { name: "work", path: "/work" },
];

test.describe("visual @visual", () => {
  test.use({ reducedMotion: "reduce" });
  test.beforeEach(() => {
    test.skip(test.info().project.name === "desktop-dark", "desktop-light covers both themes");
  });

  for (const route of routes) {
    for (const theme of themes) {
      test(`${route.name} looks the same in ${theme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
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
        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          fullPage: true,
          animations: "disabled",
          mask: [page.locator("[data-visual-mask]")],
          // Measured noise between two CI runs of an unchanged page: most images
          // identical, the rest at most ~100 pixels off by 3/255 in colour. So a
          // tight colour threshold ignores that noise, and any real change (a 1 px
          // outline, an 8 px notch move) fails. A ratio of the page would not:
          // 0.1% of a desktop page is about 2,000 pixels.
          threshold: 0.05,
          maxDiffPixels: 25,
        });
      });
    }
  }
  for (const theme of themes) {
    test(`footer boarding pass looks the same in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      // A resolved copy, so the pass says "Email copied" whatever the browser allows.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: () => Promise.resolve() },
          configurable: true,
        });
      });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await page.getByRole("button", { name: "Copy email" }).click();
      const footer = page.locator("section[aria-labelledby='next-stop-title']");
      await expect(footer.locator(".boarding-pass")).toBeVisible();
      await expect(footer).toHaveScreenshot(`footer-pass-${theme}.png`, {
        animations: "disabled",
        // The sticky site header would otherwise sit over the footer on short phones.
        style: "header { visibility: hidden; }",
        threshold: 0.05,
        maxDiffPixels: 25,
      });
    });
  }
});
