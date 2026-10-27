import { expect, test } from "@playwright/test";

// Late web fonts must not move the page (regression of the tablet failure after #116). The fix is
// `display: "optional"` in src/app/fonts.ts: a font that is not ready at first paint is skipped
// for that view instead of swapped in.
//
// With the stylesheet inline (experimental.inlineCss) the first paint no longer waits for a second
// round trip, so on a real network it can happen before the web fonts arrive. The browser paints in
// the fallback font and then swaps. On Linux, where next/font's fallback (`local(Arial)`) does not
// resolve, the two fonts differ enough to move the hero. A local production build serves the fonts
// so fast that the swap happens before the first paint and hides the problem, so this test holds
// every font file back for longer than the first paint takes, then adds up the layout shifts.

// Text is positioned to a fraction of a pixel on macOS, Windows and Android, which is where the fallback
// sizes in src/styles/font-fallbacks.css are measured. Chromium on Linux at 1x rounds every glyph advance
// to a whole pixel, and no single size-adjust can follow that, so the test turns subpixel positioning on.
test.use({ launchOptions: { args: ["--font-render-hinting=none", "--enable-font-subpixel-positioning"] } });

const fontDelayMs = 1500;
const maxShift = 0.01;

test("a late web font swap does not shift the layout (cumulative layout shift under 0.01)", async ({
  page,
}) => {
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

  await page.goto("/", { waitUntil: "domcontentloaded" });
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
  const { cls, shifts } = await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __shifts: string[] };
    return { cls: w.__cls, shifts: w.__shifts };
  });
  expect(cls, `layout shifts:\n${shifts.join("\n")}`).toBeLessThan(maxShift);
});

// The fix for the test above uses `font-display: optional`, which drops a font that is late. This
// guards the other side: on a normal connection the preloaded web fonts must still be the ones used.
test("on a normal connection the web fonts are used", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
  );
  expect(loaded).toEqual(expect.arrayContaining(["Bricolage Grotesque", "Geist"]));
});
