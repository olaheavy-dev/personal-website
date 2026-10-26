import { expect, test } from "@playwright/test";

// Home height and speed (#9, PR 3). The brief asks for at most 5 viewports at 1440 x 900 and
// an LCP of at most 1.5 s on a simulated phone. Neither can be asserted on a live site's
// changing content and network, so both run only against the local production build.

test.skip(Boolean(process.env.E2E_BASE_URL), "measured against the local production build");

test.describe("home height", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("is at most 5 viewports tall at 1440 x 900", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(height / 900, `${height}px`).toBeLessThanOrEqual(5);
  });
});

// Lighthouse's mobile simulation: 1.6 Mbit/s down, 750 kbit/s up, 150 ms round trip, a CPU
// four times slower. Chromium only (the throttling comes from the DevTools protocol); the
// median of three loads smooths out a noisy machine.
test.describe("largest contentful paint", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DevTools protocol throttling");

  test("is at most 1500 ms in the hero, median of 3, on simulated mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "one phone run is the measurement");
    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1000 * 1000) / 8,
      uploadThroughput: (750 * 1000) / 8,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const entries: { time: number; inHero: boolean; tag: string }[] = [];
      (window as unknown as { __lcp: typeof entries }).__lcp = entries;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
          entries.push({
            time: entry.startTime,
            inHero: Boolean(entry.element?.closest("main > section:first-child")),
            tag: entry.element?.tagName ?? "none",
          });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });

    const runs: { time: number; inHero: boolean; tag: string }[] = [];
    for (let run = 0; run < 3; run += 1) {
      await page.goto("/", { waitUntil: "load" });
      await page.waitForTimeout(500);
      const last = await page.evaluate(() =>
        (window as unknown as { __lcp: { time: number; inHero: boolean; tag: string }[] }).__lcp.at(-1)!,
      );
      runs.push(last);
    }
    const times = runs.map((r) => r.time).sort((a, b) => a - b);
    const median = times[1]!;
    testInfo.annotations.push({ type: "lcp", description: `${times.map(Math.round).join(", ")} ms` });
    for (const r of runs) expect(r.inHero, `LCP element ${r.tag} is in the hero`).toBe(true);
    expect(median, `LCP runs ${times.map(Math.round).join(", ")} ms`).toBeLessThanOrEqual(1500);
  });
});
