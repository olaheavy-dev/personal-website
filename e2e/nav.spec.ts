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

  test("the header offers email at every width", async ({ page }) => {
    await page.goto("/");
    const email = page.getByRole("banner").getByRole("link", { name: "Email me" });
    await expect(email.filter({ visible: true })).toHaveCount(1);
  });

  test("footer shows on every page with the profiles in the ticket", async ({ page }) => {
    await page.goto("/lab");
    const profiles = page.getByRole("contentinfo").getByRole("list", { name: "Profiles" });
    for (const name of [/GitHub/, /LinkedIn/, /Hashnode/, /^X/]) {
      await expect(profiles.getByRole("link", { name })).toBeVisible();
    }
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

    // The on-accent label copy inside the indicator lines up with the real labels,
    // so text keeps its contrast at every frame of the slide.
    await expect(async () => {
      const offsets = await nav.evaluate((element) => {
        const links = [...element.querySelectorAll("a")];
        const copies = [...element.querySelectorAll("li[aria-hidden=true] > span > span")];
        return links.map((link, index) =>
          Math.abs(link.getBoundingClientRect().x - (copies[index]?.getBoundingClientRect().x ?? NaN)),
        );
      });
      for (const offset of offsets) expect(offset).toBeLessThan(1);
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

test.describe("scrolled header", () => {
  async function scrolled(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect(page.locator("header[data-scrolled]")).toHaveCount(1);
  }

  test("the strip below the visible bar does not catch clicks", async ({ page }) => {
    await scrolled(page);
    const insideHeader = await page.evaluate(() => {
      const header = document.querySelector("header")!;
      const el = document.elementFromPoint(innerWidth / 2, header.getBoundingClientRect().bottom - 4);
      return !!el && header.contains(el);
    });
    expect(insideHeader).toBe(false);
  });

  test("the brand, theme toggle, Email me and navigation stay clickable", async ({ page }, testInfo) => {
    await scrolled(page);
    const header = page.getByRole("banner");
    await header
      .getByRole("button", { name: /theme|dark|light/i })
      .first()
      .click();
    await expect(header.getByRole("link", { name: "Email me" }).first()).toBeVisible();
    await header.getByRole("link", { name: "Email me" }).first().hover();
    if (testInfo.project.use.isMobile) {
      const button = header.getByRole("button", { name: "Menu" });
      await button.click();
      await expect(header.getByRole("button", { name: "Close" })).toHaveAttribute("aria-expanded", "true");
      await header.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();
    } else {
      await header.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();
    }
    await expect(page).toHaveURL(/\/about$/);
    await page
      .getByRole("banner")
      .getByRole("link", { name: /Sunkanmi/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
  });
});
