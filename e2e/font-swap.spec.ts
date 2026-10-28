import { expect, test, type Page } from "@playwright/test";

// A late web font must not move the page (regression of the tablet failure after #116).
//
// With the stylesheet inline (experimental.inlineCss) the first paint no longer waits for a second
// round trip, so on a real network it can happen before the web fonts arrive. The browser paints in
// a fallback font and then swaps. A local production build serves the fonts so fast that the swap
// happens before the first paint and hides the problem, so these tests hold every font file back for
// longer than the first paint takes, then add up the layout shifts. What keeps the swap quiet is
// `font-display: swap` plus the size matched fallbacks in src/styles/font-fallbacks.css, and a
// reserved height for the one paragraph whose line count differs (src/components/home/HeroTickets.tsx).

const fontDelayMs = 1500;
// Pages where the swap is measured: Home, and /work, whose rail, navigation links and credits
// moved in the swap seen on the live smoke run (#137).
const pages = ["/", "/work"];

async function lateFontShift(page: Page, path: string) {
  let delayed = 0;
  await page.route(/\.woff2?(\?|$)/, async (route) => {
    delayed += 1;
    await new Promise((resolve) => setTimeout(resolve, fontDelayMs));
    await route.continue();
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __shifts: string[]; __cls: number };
    w.__cls = 0;
    w.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
        sources: { node: Element | null; previousRect: DOMRect; currentRect: DOMRect }[];
      }[]) {
        if (entry.hadRecentInput) continue;
        w.__cls += entry.value;
        // What moved, for the failure message.
        const moved = entry.sources.map((source) => {
          const box = (r: DOMRect) =>
            `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
          return `${source.node?.nodeName ?? "?"} ${box(source.previousRect)} to ${box(source.currentRect)}`;
        });
        w.__shifts.push(`${entry.value.toFixed(4)}: ${moved.join("; ")}`);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Stay at the top while the fonts arrive (a swap only counts when the moved text is on screen),
  // then scroll through the rest of the page.
  await page.waitForTimeout(fontDelayMs + 700);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  expect(delayed, "the page asked for web font files").toBeGreaterThan(0);
  return page.evaluate(() => {
    const w = window as unknown as { __cls: number; __shifts: string[] };
    return { cls: w.__cls, shifts: w.__shifts };
  });
}

for (const path of pages) {
  test(`with subpixel text positioning a late web font swap shifts ${path} by less than 0.01`, async ({
    playwright,
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    userAgent,
    deviceScaleFactor,
    colorScheme,
  }) => {
    // These flags make Chromium on Linux lay text out with the same letter widths I measured in Chromium
    // on macOS (the fallback sizes in font-fallbacks.css come from those measurements; the method and
    // the figures are in that file and in the "Font display" line of docs/decisions/README.md).
    const browser = await playwright.chromium.launch({
      args: ["--font-render-hinting=none", "--enable-font-subpixel-positioning"],
    });
    try {
      const context = await browser.newContext({
        baseURL,
        viewport,
        isMobile,
        hasTouch,
        userAgent,
        deviceScaleFactor,
        colorScheme,
      });
      const { cls, shifts } = await lateFontShift(await context.newPage(), path);
      expect(cls, `layout shifts:\n${shifts.join("\n")}`).toBeLessThan(0.01);
    } finally {
      await browser.close();
    }
  });
}

// Chromium on Linux at 1x rounds every glyph advance to a whole pixel. The web font and the fallback
// round differently, so no single size-adjust can follow, and a paragraph can wrap one line differently.
// This is the strictest case, and the one the CI runner uses for the live smoke run.
for (const path of pages) {
  test(`with Linux default text rendering a late web font swap shifts ${path} by less than 0.01`, async ({
    page,
  }) => {
    const { cls, shifts } = await lateFontShift(page, path);
    expect(cls, `layout shifts:\n${shifts.join("\n")}`).toBeLessThan(0.01);
  });
}

// The test above only proves the swap is quiet. This proves the web fonts still apply: on a normal
// connection the preloaded Bricolage Grotesque and Geist must end up loaded.
test("the web fonts apply on a normal connection", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
  );
  expect(loaded).toEqual(expect.arrayContaining(["Bricolage Grotesque", "Geist"]));
});
