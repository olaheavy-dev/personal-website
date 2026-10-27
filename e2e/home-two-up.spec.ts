import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Home, the Lab and Latest writing two-up (#9, PR 3). The rows come from the fake Supabase
// server (e2e/fixtures/fake-content.mjs), which copies the seed; every page flag is On there.
// Latest writing has no posts until #14, so the Lab strip spans the full width.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const strip = (page: Page) => page.locator("#lab-strip");
const card = (page: Page, name: string) => strip(page).getByRole("article", { name });
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("lab strip", () => {
  test("shows Foresight, FastPilot and HomeScout in order with the approved lines, and no SabiTutor", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(strip(page).getByRole("heading", { level: 2, name: "In the lab" })).toBeVisible();
    await expect(strip(page).getByRole("heading", { level: 3 })).toHaveText([
      "Foresight",
      "FastPilot",
      "HomeScout",
    ]);
    await expect(
      strip(page).getByText(
        "A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.",
      ),
    ).toBeVisible();
    await expect(
      strip(page).getByText("A production RAG system for learning FastAPI: understand, watch, practise."),
    ).toBeVisible();
    await expect(
      strip(page).getByText(
        "A home decision workspace for people buying or renting in England, at the research and concept stage.",
      ),
    ).toBeVisible();
    await expect(page.getByText("SabiTutor")).toHaveCount(0);
    // Lab is visible, so "See the whole lab" links to it, as "See all work" does to Work.
    await expect(strip(page).getByRole("link", { name: /See the whole lab/ })).toHaveAttribute(
      "href",
      "/lab",
    );
  });

  test("tags only HomeScout In progress, in its stub, and starts every card with its name", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(strip(page).getByText("In progress")).toHaveCount(1);
    await expect(card(page, "HomeScout").locator(".ticket-stub").getByText("In progress")).toBeVisible();
    await expect(strip(page).getByText(/^Project 0/)).toHaveCount(0);
  });

  test("links each project to the evidence it has, in a new tab, with 'Try it' only for a live URL", async ({
    page,
  }) => {
    await page.goto("/");
    const hrefs = async (name: string) =>
      card(page, name)
        .getByRole("list", { name: `${name} links` })
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => [link.textContent?.trim(), link.getAttribute("href")]));
    expect(await hrefs("Foresight")).toEqual([
      ["GitHub (Foresight, opens in a new tab)", "https://github.com/olaheavy-dev/Foresight"],
      ["Try it (Foresight, opens in a new tab)", "https://foresight.olaheavy.dev"],
    ]);
    expect(await hrefs("FastPilot")).toEqual([
      ["GitHub (FastPilot, opens in a new tab)", "https://github.com/olaheavy-dev/fastpilot"],
      [
        "Demo video (FastPilot, opens in a new tab)",
        "https://www.loom.com/share/a1d6bf3ee7c54e5c93de4ac8c280992f",
      ],
    ]);
    expect(await hrefs("HomeScout")).toEqual([
      ["GitHub (HomeScout, opens in a new tab)", "https://github.com/olaheavy-dev/homescout-platform"],
    ]);
    for (const link of await strip(page)
      .getByRole("list", { name: /links$/ })
      .getByRole("link")
      .all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("shows only the two approved figures, each linking to its repository", async ({ page }) => {
    await page.goto("/");
    const figures = strip(page).getByRole("link", { name: /\(source: / });
    await expect(figures).toHaveCount(2);
    await expect(figures.nth(0)).toContainText("17 evaluation suites");
    await expect(figures.nth(0)).toHaveAttribute("href", "https://github.com/olaheavy-dev/Foresight");
    await expect(figures.nth(1)).toContainText("0.992 answer faithfulness");
    await expect(figures.nth(1)).toHaveAttribute("href", "https://github.com/olaheavy-dev/fastpilot");
    // The other seeded FastPilot figures stay off Home.
    await expect(strip(page).getByText(/~210|90%/)).toHaveCount(0);
    await expect(card(page, "HomeScout").getByRole("link", { name: /\(source: / })).toHaveCount(0);
  });

  test("shows no project twice on Home, and one What's next band only, in the footer", async ({ page }) => {
    await page.goto("/");
    const names = await page.locator("main h3").allTextContents();
    expect(new Set(names).size).toBe(names.length);
    for (const name of ["Foresight", "FastPilot", "HomeScout"]) {
      expect(names.filter((n) => n === name)).toHaveLength(1);
    }
    await expect(page.getByRole("region", { name: "Yours?" })).toHaveCount(1);
    await expect(page.locator("main").getByRole("region", { name: "Yours?" })).toHaveCount(0);
  });

  test("makes the Lab strip span the width while Writing has no posts, three across on a wide screen", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("#latest-writing")).toHaveCount(0);
    const [room, box] = await page.evaluate(() => {
      const row = document.querySelector("#lab-writing")!;
      const style = getComputedStyle(row);
      return [
        row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        document.querySelector("#lab-strip")!.getBoundingClientRect().width,
      ];
    });
    expect(Math.abs(room! - box!)).toBeLessThanOrEqual(1);
    if (testInfo.project.use.viewport!.width >= 1200) {
      const tops = await strip(page)
        .getByRole("article")
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      const heights = await strip(page)
        .getByRole("article")
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
      expect(new Set(heights).size).toBe(1);
      // The evidence links share a row, and so do the perforations: every card has a stub.
      for (const selector of ["ul[aria-label$=' links']", ".ticket-stub"]) {
        const rows = await strip(page)
          .locator(selector)
          .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
        expect(rows, selector).toHaveLength(3);
        expect(new Set(rows).size, selector).toBe(1);
      }
      // The links sit directly under the longest summary, with no gap beyond the usual one.
      const gap = await card(page, "Foresight").evaluate((el) => {
        const text = el.querySelector("[data-summary]")!.getBoundingClientRect();
        const links = el.querySelector("ul[aria-label$=' links']")!.getBoundingClientRect();
        return links.top - text.bottom;
      });
      expect(gap).toBeLessThanOrEqual(16);
    }
  });

  test("Tab walks the strip's links in order and the focus ring shows", async ({ page }) => {
    await page.goto("/");
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute("href") ?? null);
    let href: string | null = null;
    for (let i = 0; i < 80 && href !== "https://github.com/olaheavy-dev/Foresight"; i += 1) {
      await page.keyboard.press("Tab");
      href = await focused();
    }
    expect(href).toBe("https://github.com/olaheavy-dev/Foresight");
    // The Foresight card has its figure link too, after the card's evidence links.
    const order = ["https://foresight.olaheavy.dev", "https://github.com/olaheavy-dev/Foresight"];
    for (const expected of [
      ...order,
      "https://github.com/olaheavy-dev/fastpilot",
      "https://www.loom.com/share/a1d6bf3ee7c54e5c93de4ac8c280992f",
      "https://github.com/olaheavy-dev/fastpilot",
      "https://github.com/olaheavy-dev/homescout-platform",
    ]) {
      await page.keyboard.press("Tab");
      expect(await focused()).toBe(expected);
    }
    // The site's focus ring is a box shadow (tokens.css), not an outline.
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement!).boxShadow);
    expect(ring).not.toBe("none");
  });

  test("fits 375 px and 360 px without scrolling sideways, and keeps each figure on one line", async ({
    page,
  }) => {
    for (const width of [375, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      expect(await overflow(page), `${width}px`).toBeLessThanOrEqual(0);
      await expect(strip(page).getByRole("heading", { level: 3 })).toHaveCount(3);
      const lines = await strip(page)
        .locator("span.font-semibold.whitespace-nowrap")
        .evaluateAll((els) =>
          els.map((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return range.getClientRects().length;
          }),
        );
      expect(lines).toEqual([1, 1]);
    }
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).include("#lab-writing").withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });

  test("has nothing moving, and transitions only near zero, under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const state = await page.evaluate(() => {
      const root = document.querySelector("#lab-writing")!;
      const running = root.getAnimations({ subtree: true }).length;
      const seconds = [...root.querySelectorAll("*")].map((el) =>
        Math.max(
          ...getComputedStyle(el)
            .transitionDuration.split(",")
            .map((value) => parseFloat(value)),
        ),
      );
      return { running, longest: Math.max(...seconds) };
    });
    expect(state.running).toBe(0);
    expect(state.longest).toBeLessThan(0.01);
  });
});

test.describe("lab strip without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("is plain server rendered content", async ({ page }) => {
    await page.goto("/");
    await expect(strip(page).getByRole("heading", { level: 3 })).toHaveText([
      "Foresight",
      "FastPilot",
      "HomeScout",
    ]);
    await expect(strip(page).getByText("In progress")).toHaveCount(1);
    await expect(strip(page).getByRole("link", { name: /Try it/ })).toHaveAttribute(
      "href",
      "https://foresight.olaheavy.dev",
    );
  });
});
