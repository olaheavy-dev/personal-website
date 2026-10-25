import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The logo rail on Home (#9, PR 1). Marks are CSS masks over a token colour; the names are
// text. Nothing in the rail moves, takes focus or links anywhere.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const rail = (page: Page) => page.locator("#shipped");
const markColour = (page: Page, slug: string) =>
  page
    .locator(`[data-logo-cell="${slug}"] .logo-mark`)
    .evaluate((el) => getComputedStyle(el).backgroundColor);

type Box = { left: number; right: number; top: number; height: number };

/** The seven client marks, in page order: HBK, the three Deimos clients, then the last three. */
function clientBoxes(page: Page): Promise<Box[]> {
  return rail(page)
    .locator("[data-logo-cell] .logo-mark")
    .evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, height: box.height };
      }),
    );
}

async function isDark(page: Page) {
  return page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches);
}

test.describe("logo rail", () => {
  test("names every company in text, in order, under one heading", async ({ page }) => {
    await page.goto("/");
    await expect(rail(page).getByRole("heading", { level: 2, name: "Where I've shipped" })).toBeVisible();
    const text = await rail(page).evaluate((el) => el.textContent ?? "");
    const order = ["HBK", "via", "Mukuru", "uLesson", "Optty", "Stanbic IBTC", "Access Bank", "Galooli"].map(
      (name) => text.indexOf(name),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("has no focusable element, and Tab never lands in it", async ({ page }) => {
    await page.goto("/");
    const focusable = await rail(page).evaluate(
      (el) =>
        el.querySelectorAll("a[href], button, input, select, textarea, [tabindex], [contenteditable]").length,
    );
    expect(focusable).toBe(0);
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest("#shipped"));
      expect(inside).toBe(false);
    }
  });

  test("draws every mark with a mask file served from public/", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/logos/") && !response.ok()) failed.push(response.url());
    });
    await page.goto("/");
    const marks = await rail(page)
      .locator("[data-logo]")
      .evaluateAll((els) =>
        els.map((el) => {
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return {
            logo: el.getAttribute("data-logo"),
            width: box.width,
            height: box.height,
            mask: style.maskImage,
          };
        }),
      );
    expect(marks).toHaveLength(8);
    for (const mark of marks) {
      expect(mark.width, mark.logo!).toBeGreaterThan(20);
      // Even the small "via Deimos" credit stays legible: about the label's cap height.
      expect(mark.height, mark.logo!).toBeGreaterThanOrEqual(9);
      expect(mark.mask, mark.logo!).toContain(`/logos/`);
    }
    expect(failed).toEqual([]);
  });

  test("changes colour on hover only where a pointer can hover", async ({ page }) => {
    await page.goto("/");
    const canHover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
    const rest = await markColour(page, "hbk");
    await page.locator('[data-logo-cell="hbk"]').hover();
    await page.waitForTimeout(400);
    const hovered = await markColour(page, "hbk");
    if (canHover) {
      // HBK's own colour from its logo file: teal blue in light, teal in dark.
      expect(hovered).toBe((await isDark(page)) ? "rgb(46, 163, 159)" : "rgb(0, 51, 90)");
      expect(hovered).not.toBe(rest);
    } else {
      expect(hovered).toBe(rest);
    }
  });

  test("Optty, whose file is white only, hovers to full ink", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.evaluate(() => matchMedia("(hover: hover)").matches)),
      "needs a pointer that hovers",
    );
    await page.locator('[data-logo-cell="optty"]').hover();
    await page.waitForTimeout(400);
    const dark = await isDark(page);
    expect(await markColour(page, "optty")).toBe(dark ? "rgb(237, 234, 242)" : "rgb(20, 20, 24)");
  });

  test("fades the hover colour normally, and not at all under reduced motion", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.evaluate(() => matchMedia("(hover: hover)").matches)),
      "needs a pointer that hovers",
    );
    const duration = () =>
      page
        .locator('[data-logo-cell="hbk"] .logo-mark')
        .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await duration()).toBeGreaterThan(0.1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Seconds. Under reduced motion the site's global rule makes every transition near instant.
    expect(await duration()).toBeLessThan(0.001);
    // The colour still changes: only the fade goes.
    await page.locator('[data-logo-cell="hbk"]').hover();
    const rest = await markColour(page, "galooli");
    await expect.poll(() => markColour(page, "hbk")).not.toBe(rest);
  });

  test("keeps the logos visible under forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const colours = await rail(page)
      .locator(".logo-mark")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colours).toHaveLength(8);
    for (const colour of colours) {
      expect(colour).not.toBe(canvas);
      expect(colour).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  for (const width of [360, 375]) {
    test(`does not scroll sideways at ${width} px, and no logo touches an edge`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const edges = await rail(page)
        .locator("[data-logo]")
        .evaluateAll((els) =>
          els.map((el) => {
            const box = el.getBoundingClientRect();
            return { logo: el.getAttribute("data-logo"), left: box.left, right: box.right };
          }),
        );
      for (const edge of edges) {
        expect(edge.left, edge.logo!).toBeGreaterThanOrEqual(15);
        expect(edge.right, edge.logo!).toBeLessThanOrEqual(width - 15);
      }
    });
  }

  test("gives every logo a cell at least 44 px tall", async ({ page }) => {
    await page.goto("/");
    const heights = await rail(page)
      .locator("[data-logo-cell]")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights).toHaveLength(7);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  });

  test("at 1440 puts all seven logos on one line with equal gaps, and the bracket spans the middle three", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const boxes = await clientBoxes(page);
    const centres = boxes.map((box) => box.top + box.height / 2);
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(2);
    const gaps = boxes.slice(1).map((box, i) => box.left - boxes[i]!.right);
    expect(gaps).toHaveLength(6);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(4);
    const label = await page.locator(".logo-group-label").boundingBox();
    expect(Math.abs(label!.x - boxes[1]!.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(label!.x + label!.width - boxes[3]!.right)).toBeLessThanOrEqual(2);
  });

  test("at 768 keeps each row on one line and the bracket under its three logos", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const boxes = await clientBoxes(page);
    const centre = (box: Box) => box.top + box.height / 2;
    const first = [boxes[1]!, boxes[2]!, boxes[3]!].map(centre);
    const second = [boxes[4]!, boxes[5]!, boxes[6]!].map(centre);
    expect(Math.max(...first) - Math.min(...first)).toBeLessThanOrEqual(2);
    expect(Math.max(...second) - Math.min(...second)).toBeLessThanOrEqual(2);
    expect(second[0]!).toBeGreaterThan(first[0]! + 40);
    const label = await page.locator(".logo-group-label").boundingBox();
    expect(Math.abs(label!.x - boxes[1]!.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(label!.x + label!.width - boxes[3]!.right)).toBeLessThanOrEqual(2);
  });

  test("on a phone reads in order: HBK, then the Deimos group, then the last three", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    const boxes = await clientBoxes(page);
    const rowOf = (box: Box) => Math.round((box.top + box.height / 2) / 30);
    // Same order on screen as in the page: never above, and never to the left on the same row.
    for (let i = 1; i < boxes.length; i++) {
      const previous = boxes[i - 1]!;
      const box = boxes[i]!;
      const sameRow = Math.abs(box.top + box.height / 2 - (previous.top + previous.height / 2)) < 20;
      expect(sameRow ? box.left > previous.left : box.top > previous.top, `logo ${i}`).toBe(true);
    }
    // HBK alone on row 1, left aligned; the three group logos share row 2; the rest row 3.
    expect(boxes[0]!.left).toBeLessThan(40);
    const rows = boxes.map(rowOf);
    expect(rows[1]).toBe(rows[2]);
    expect(rows[2]).toBe(rows[3]);
    expect(rows[4]).toBe(rows[5]);
    expect(rows[5]).toBe(rows[6]);
    expect(rows[0]).toBeLessThan(rows[1]!);
    expect(rows[3]).toBeLessThan(rows[4]!);
  });

  test("keeps the Deimos group together and in one piece", async ({ page }) => {
    await page.goto("/");
    const group = await page.locator(".logo-group").boundingBox();
    const members = await page.locator(".logo-group-list [data-logo-cell]").evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    expect(members).toHaveLength(3);
    for (const member of members) {
      expect(member.left).toBeGreaterThanOrEqual(group!.x - 1);
      expect(member.right).toBeLessThanOrEqual(group!.x + group!.width + 1);
      expect(member.top).toBeGreaterThanOrEqual(group!.y - 1);
      expect(member.bottom).toBeLessThanOrEqual(group!.y + group!.height + 1);
    }
  });

  test("has no detectable accessibility violations, with a logo hovered", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    await page.locator('[data-logo-cell="galooli"]').hover();
    const results = await new AxeBuilder({ page }).include("#shipped").withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });
});
