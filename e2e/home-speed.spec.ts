import { expect, test } from "@playwright/test";

// Home height and speed (#9, PR 3). The brief asks for at most 5 viewports at 1440 x 900 and
// an LCP of at most 1.5 s on a simulated phone. Neither can be asserted on a live site's
// changing content and network, so both run only against the local production build.

test.skip(Boolean(process.env.E2E_BASE_URL), "measured against the local production build");

test.describe("home height", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("is at most 5 viewports tall at 1440 x 900", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-light", "the height does not depend on the theme");
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(height / 900, `${height}px`).toBeLessThanOrEqual(5);
  });
});

// Lighthouse's own mobile "request level" (devtools) throttling, taken from its source and not
// rounded: mobileSlow4G in the Lantern constants (@paulirish/trace_engine, models/trace/lantern/
// simulation/Constants.js, the file core/config/constants.js imports as
// `Lantern.Simulation.Constants.throttling`) gives rttMs 150 and throughput 1.6 * 1024 kbit/s,
// and the devtools method corrects them with DEVTOOLS_RTT_ADJUSTMENT_FACTOR 3.75 and
// DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR 0.9: latency 562.5 ms, download 1474.56 kbit/s, upload
// 675 kbit/s, and cpuSlowdownMultiplier 4. Why: https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
// (request level throttling, and the 4x CPU default). Kbit/s to the protocol's bytes/s is * 1024 / 8.
const latency = 150 * 3.75;
const download = (1.6 * 1024 * 0.9 * 1024) / 8;
const upload = (750 * 0.9 * 1024) / 8;

type Entry = { time: number; inHero: boolean; tag: string };

// Network.emulateNetworkConditions is marked deprecated in the protocol; its replacement,
// Network.emulateNetworkConditionsByRule, is still marked experimental, so this keeps the stable
// deprecated command (the one DevTools and Lighthouse's devtools method still use). Revisit when
// the replacement is stable in the pinned Chromium.
// Chromium only (DevTools protocol). It runs alone (`make e2e-speed`, one worker), because a
// parallel worker would take the CPU the throttling is measured against. The median of three
// loads smooths out a noisy machine.
test.describe("largest contentful paint", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DevTools protocol throttling");

  test("@speed is at most 1500 ms in the hero, median of 3, on simulated mobile", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "one phone run is the measurement");
    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency,
      downloadThroughput: download,
      uploadThroughput: upload,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const entries: Entry[] = [];
      (window as unknown as { __lcp: Entry[] }).__lcp = entries;
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

    const runs: Entry[] = [];
    for (let run = 0; run < 3; run += 1) {
      await page.goto("/", { waitUntil: "load" });
      // Wait for an entry, then for one second with no new one (the last entry is the LCP).
      await page.waitForFunction(() => (window as unknown as { __lcp: Entry[] }).__lcp.length > 0);
      let count = -1;
      for (;;) {
        const now = await page.evaluate(() => (window as unknown as { __lcp: Entry[] }).__lcp.length);
        if (now === count) break;
        count = now;
        await page.waitForTimeout(1000);
      }
      const last = await page.evaluate(() => (window as unknown as { __lcp: Entry[] }).__lcp.at(-1));
      expect(last, "an LCP entry was recorded").toBeDefined();
      runs.push(last!);
    }
    const times = runs.map((r) => r.time).sort((a, b) => a - b);
    const median = times[1]!;
    testInfo.annotations.push({ type: "lcp", description: `${times.map(Math.round).join(", ")} ms` });
    for (const r of runs) expect(r.inHero, `LCP element ${r.tag} is in the hero`).toBe(true);
    expect(median, `LCP runs ${times.map(Math.round).join(", ")} ms`).toBeLessThanOrEqual(1500);
  });
});
