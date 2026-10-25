import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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
    await expect(stops.getByText("Stop 04 · via Deimos")).toBeVisible();
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
    await expect(stops.getByText("(Google Play)")).toBeVisible();
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

  test("spaces every home section by the same gap, down to the footer", async ({ page }) => {
    await page.goto("/");
    const gaps = await page.evaluate(() => {
      const blocks = ["main > section:first-child", "#shipped", "#journey", "#selected-stops", "footer"].map(
        (selector) => document.querySelector(selector)!.getBoundingClientRect(),
      );
      return blocks.slice(1).map((box, index) => Math.round(box.top - blocks[index]!.bottom));
    });
    expect(gaps).toHaveLength(4);
    for (const gap of gaps) expect(Math.abs(gap - gaps[0]!)).toBeLessThanOrEqual(1);
  });

  test("marks the three home sections with one clearly visible label style", async ({ page }) => {
    await page.goto("/");
    const labels = await page
      .locator("#shipped-title, #journey-title, #selected-stops-title")
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el)).map((s) => [s.fontSize, s.color, s.textTransform]),
      );
    expect(labels).toHaveLength(3);
    expect(new Set(labels.map((label) => label.join("|"))).size).toBe(1);
    expect(labels[0]![0]).toBe("14px");
    expect(labels[0]![2]).toBe("uppercase");
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

  test("has no accessibility violations with each source popover open", async ({ page }) => {
    await page.goto("/");
    await section(page).scrollIntoViewIfNeeded();
    const triggers = section(page).getByRole("button", { name: /^Source for / });
    await expect(triggers).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      // showPopover() opens it without a click that would scroll or move the pointer.
      await triggers.nth(index).evaluate((button) => {
        button.scrollIntoView({ block: "center" });
        document.getElementById(button.getAttribute("popovertarget") ?? "")?.showPopover();
      });
      await expect(page.locator(".source-popover:popover-open")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(results.violations, `popover ${index + 1}`).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.locator(".source-popover:popover-open")).toHaveCount(0);
    }
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
