import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fakeUrl } from "./fixtures/fake-constants.mjs";

// Home, Selected stops (#9, PR 2). The rows come from the fake Supabase server
// (e2e/fixtures/fake-content.mjs), which copies the seed.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const section = (page: Page) => page.locator("#selected-stops");
const remote = Boolean(process.env.E2E_BASE_URL);

test.describe("selected stops", () => {
  test("shows HBK, Optty and Access Bank as tickets, newest first, with the approved copy", async ({
    page,
  }) => {
    await page.goto("/");
    const stops = section(page);
    await expect(stops.getByRole("heading", { level: 2, name: "Selected stops" })).toBeVisible();
    await expect(stops.getByRole("heading", { level: 3 })).toHaveText(["HBK", "Optty", "Access Bank"]);
    await expect(stops.getByText("Stop 07 · Now")).toBeVisible();
    await expect(stops.getByText("Stop 04 · Optty · via Deimos")).toBeVisible();
    await expect(stops.getByText("Stop 02", { exact: true })).toBeVisible();
    await expect(stops.getByText(/^Designing and building the Advantage Insights/)).toBeVisible();
    await expect(stops.getByText(/^Design and delivery of the integrations behind Optty's/)).toBeVisible();
    await expect(stops.getByText(/^Built and shipped QuickBucks and Instant Account/)).toBeVisible();
  });

  test("gives each ticket one sourced chip with its attribution", async ({ page }) => {
    await page.goto("/");
    const stops = section(page);
    await expect(stops.getByRole("button", { name: /^Source for / })).toHaveCount(3);
    await expect(stops.getByText("(HBK)")).toBeVisible();
    await expect(stops.getByText("(Optty, 2023)")).toBeVisible();
    await expect(stops.getByText("(Google Play, 2026)")).toBeVisible();
  });

  test("links only to /work: no case study is live and the Work page is not either", async ({ page }) => {
    test.skip(remote, "the flags of a live site decide this");
    await page.goto("/");
    const hrefs = await section(page)
      .getByRole("link")
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
    expect(hrefs).toEqual(["/work"]);
    await expect(section(page).getByRole("link", { name: /See the whole route/ })).toBeVisible();
  });

  test("opens each source from the keyboard, then Escape closes it and focus returns", async ({ page }) => {
    await page.goto("/");
    const button = section(page).getByRole("button", { name: /^Source for 90\+/ });
    await button.focus();
    await page.keyboard.press("Enter");
    const popover = page.locator(".source-popover:popover-open");
    await expect(popover).toBeVisible();
    await expect(
      popover.getByRole("link", { name: /Optty and Triple-A announcement, 2023/ }),
    ).toHaveAttribute("href", expect.stringContaining("triple-a.io"));
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("keeps every figure on one line and the page from scrolling sideways", async ({ page }) => {
    await page.goto("/");
    const lines = await section(page)
      .locator("span.font-semibold.whitespace-nowrap")
      .evaluateAll((els) =>
        els.map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getClientRects().length;
        }),
      );
    expect(lines).toEqual([1, 1, 1]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("fits 375 px as well as 360 px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(section(page).getByRole("heading", { level: 3 })).toHaveCount(3);
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("selected stops without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("is plain server rendered content", async ({ page }) => {
    await page.goto("/");
    await expect(section(page).getByRole("heading", { level: 3 })).toHaveText([
      "HBK",
      "Optty",
      "Access Bank",
    ]);
    await expect(section(page).getByText("(Optty, 2023)")).toBeVisible();
  });
});

test.describe("the fake content server", () => {
  test.skip(remote, "needs the fake Supabase server");

  test("answers empty or with an error on request, and is reset afterwards", async ({ request }) => {
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
});
