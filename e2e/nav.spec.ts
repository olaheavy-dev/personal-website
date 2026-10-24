import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sections = [
  { path: "/work", label: "Work" },
  { path: "/lab", label: "Lab" },
  { path: "/writing", label: "Writing" },
  { path: "/travel", label: "Travel" },
  { path: "/about", label: "About" },
];

test.describe("sections and navigation", () => {
  for (const { path, label } of sections) {
    test(`${label} page loads, has one heading and no axe violations`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page).toHaveTitle(new RegExp(`^${label} \\|`));
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("footer shows on every page with only configured profiles", async ({ page }) => {
    await page.goto("/lab");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /GitHub/ })).toBeVisible();
    await expect(footer.getByRole("link", { name: /LinkedIn/ })).toHaveCount(0);
  });
});

test.describe("desktop pill nav", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("moves the current marker as you navigate", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.locator("a[aria-current=page]")).toHaveCount(0);
    await nav.getByRole("link", { name: "Writing" }).click();
    await expect(page).toHaveURL(/\/writing$/);
    await expect(nav.getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "page");

    // The lilac indicator sits under the active link, not elsewhere.
    const indicator = nav.locator("li[aria-hidden=true]");
    await expect(async () => {
      const marker = await indicator.boundingBox();
      const link = await nav.getByRole("link", { name: "Writing" }).boundingBox();
      expect(marker && link && Math.abs(marker.x - link.x)).toBeLessThan(2);
      expect(marker && link && Math.abs(marker.width - link.width)).toBeLessThan(2);
    }).toPass();
  });
});

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("opens, navigates, and closes with Escape returning focus", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Menu" });
    await button.click();
    const menu = page.getByRole("navigation", { name: "Main" });
    await expect(menu.getByRole("link")).toHaveCount(5);
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    await expect(menu).toBeHidden();

    await button.click();
    await menu.getByRole("link", { name: "Travel" }).click();
    await expect(page).toHaveURL(/\/travel$/);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });
});
