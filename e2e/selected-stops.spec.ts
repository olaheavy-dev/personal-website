import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Home, Selected stops (#9, PR 2). The rows come from the fake Supabase server
// (e2e/fixtures/fake-content.mjs), which copies the seed.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const section = (page: Page) => page.locator("#selected-stops");
const remote = Boolean(process.env.E2E_BASE_URL);

test.describe("selected stops", () => {
  test("shows Mukuru, Optty and Access Bank as tickets, newest first, with the approved copy", async ({
    page,
  }) => {
    await page.goto("/");
    const stops = section(page);
    await expect(stops.getByRole("heading", { level: 2, name: "Selected stops" })).toBeVisible();
    await expect(stops.getByRole("heading", { level: 3 })).toHaveText(["Mukuru", "Optty", "Access Bank"]);
    await expect(stops.getByText("Stop 06 · via Deimos")).toBeVisible();
    await expect(stops.getByText("Stop 04 · via Deimos")).toBeVisible();
    await expect(stops.getByText("Stop 02", { exact: true })).toBeVisible();
    await expect(stops.getByText(/^Integrations that land Mukuru's cross-border transfers/)).toBeVisible();
    await expect(stops.getByText(/^Design and delivery of the integrations behind Optty's/)).toBeVisible();
    await expect(stops.getByText(/^Built and shipped QuickBucks and Instant Account/)).toBeVisible();
  });

  test("gives each ticket one chip whose figure links to its source, with no year in the credit", async ({
    page,
  }) => {
    await page.goto("/");
    const stops = section(page);
    const figures = stops.getByRole("link", { name: /\(source: / });
    await expect(figures).toHaveCount(3);
    await expect(figures.nth(0)).toHaveAttribute("href", expect.stringContaining("techzim.co.zw"));
    await expect(figures.nth(1)).toHaveAttribute("href", expect.stringContaining("triple-a.io"));
    await expect(figures.nth(2)).toHaveAttribute("href", expect.stringContaining("play.google.com"));
    for (const figure of await figures.all()) {
      await expect(figure).toHaveAttribute("target", "_blank");
      expect((await figure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(stops.getByText("(Mukuru)")).toBeVisible();
    await expect(stops.getByText("(Optty)")).toBeVisible();
    await expect(stops.getByText("(Google Play)")).toBeVisible();
    await expect(stops.locator("span.text-text-secondary").filter({ hasText: /\d{4}/ })).toHaveCount(0);
  });

  test("links only to /work: no case study is live and the Work page is not either", async ({ page }) => {
    test.skip(remote, "the flags of a live site decide this");
    await page.goto("/");
    const hrefs = await section(page)
      .locator("a:not([target=_blank])")
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
    expect(hrefs).toEqual(["/work"]);
    await expect(section(page).getByRole("link", { name: /See the whole route/ })).toBeVisible();
  });

  test("the hero HBK ticket shows the approved copy, and the peeking ticket reads Stop 01 Galooli", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator("main > section:first-child");
    await expect(
      hero.getByText(
        "Designing and building HBK\u2019s sensor-data analytics platform for test, durability and fatigue engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like Python code suggestions and file data analysis.",
      ),
    ).toBeVisible();
    await expect(hero.getByText("Stop 01 · Galooli", { exact: true })).toHaveCount(1);
  });

  test("the three stubs line up in the 3-up grid, and each credit follows its figure on the same line", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.use.viewport!.width < 1200, "the 3-up grid is for wide screens");
    await page.goto("/");
    const tops = await section(page)
      .locator(".ticket-stub")
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    const credit = section(page).getByText("(Mukuru)");
    const figure = section(page).getByRole("link", { name: /17M\+/ });
    const [c, f] = [(await credit.boundingBox())!, (await figure.boundingBox())!];
    expect(Math.abs(c.y + c.height / 2 - (f.y + f.height / 2))).toBeLessThan(f.height / 2);
  });

  test("each figure link is reachable by keyboard", async ({ page }) => {
    await page.goto("/");
    const figure = section(page).getByRole("link", { name: /source: Techzim, 20 years of Mukuru/ });
    await figure.focus();
    await expect(figure).toBeFocused();
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
});

test.describe("selected stops without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("is plain server rendered content", async ({ page }) => {
    await page.goto("/");
    await expect(section(page).getByRole("heading", { level: 3 })).toHaveText([
      "Mukuru",
      "Optty",
      "Access Bank",
    ]);
    await expect(section(page).getByText("(Optty)")).toBeVisible();
  });
});
