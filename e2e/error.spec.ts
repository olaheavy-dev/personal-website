import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The error boundary (issue #22). Numbers in test names are the plan's acceptance
// criteria. /_lab/error throws while the `lab-error` cookie is set, and exists only
// where LAB_PAGES=1 (Playwright's own server).
const remote = Boolean(process.env.E2E_BASE_URL);
const lab = "/_lab/error";
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.skip(remote, "the lab page is off on remote sites");

async function broken(page: Page, baseURL: string | undefined) {
  await page.context().addCookies([{ name: "lab-error", value: "1", url: baseURL }]);
  await page.goto(lab);
}

const errorHeading = (page: Page) => page.getByRole("heading", { level: 1, name: "This page hit a problem" });

test("criterion 20: shows the error page with noindex, the header and the footer", async ({
  page,
  baseURL,
}) => {
  await broken(page, baseURL);
  await expect(errorHeading(page)).toBeVisible();
  const robots = await page
    .locator("meta[name='robots']")
    .evaluateAll((all) => all.map((m) => m.getAttribute("content")).join(","));
  expect(robots).toContain("noindex");
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.getByText("internal detail")).toHaveCount(0);
});

test("criterion 21: focus moves to the error h1", async ({ page, baseURL }) => {
  await broken(page, baseURL);
  await expect(errorHeading(page)).toBeFocused();
});

test("criterion 22: Try again recovers once the cause is gone", async ({ page, baseURL }) => {
  await broken(page, baseURL);
  await page.context().clearCookies();
  await page.getByRole("button", { name: "Try again" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Recovered" })).toBeVisible();
});

test("criterion 23: Try again while the error persists shows the error again, focus on the h1", async ({
  page,
  baseURL,
}) => {
  await broken(page, baseURL);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(errorHeading(page)).toBeVisible();
  await expect(errorHeading(page)).toBeFocused();
});

test("criterion 24: Back to the start goes home and resets", async ({ page, baseURL }) => {
  await broken(page, baseURL);
  await page.getByRole("link", { name: "Back to the start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Hi, I.m/ })).toBeVisible();
});

test("criterion 26: axe clean and no sideways scroll at 360 px", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await broken(page, baseURL);
  await expect(errorHeading(page)).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(results.violations).toEqual([]);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("javascript off", () => {
  test.use({ javaScriptEnabled: false });
  test("criterion 27: the server rendered header and footer still let the visitor leave", async ({
    page,
    baseURL,
  }) => {
    // Without JavaScript the error boundary cannot mount, so the error text itself
    // does not show (the limit, written in the PR's "How it works"). The server
    // rendered header and footer around it still do, so the visitor can leave.
    await broken(page, baseURL);
    await expect(page.locator("header a[href='/']")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});

// Criterion 31 (zero CSP violations on the 404 and error states) runs once the
// security headers land in #86.
test.skip("criterion 31: no securitypolicyviolation events on the 404 and error states", () => {
  // Blocked on https://github.com/olaheavy-dev/personal-website/pull/86.
});
