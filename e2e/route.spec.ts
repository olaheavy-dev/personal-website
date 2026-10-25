import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Route component (issue #7). Numbers in test names are the plan's acceptance
// criteria. The lab page /_lab/route exists only where LAB_PAGES=1 (Playwright's own
// server); against a remote site (E2E_BASE_URL) it must answer 404 instead.
const remote = Boolean(process.env.E2E_BASE_URL);
const lab = "/_lab/route";
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => null)),
    ),
  );
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 300) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
}

async function layoutShift(page: Page, path: string) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number; __sources: string[] };
    w.__cls = 0;
    w.__sources = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
        sources: { node?: Element | null }[];
      }[]) {
        if (entry.hadRecentInput) continue;
        // Only shifts that move something inside a route count here. The footer and main
        // also shift a little on scroll, before this component (tracked in issue #71).
        if (!entry.sources.some((s) => s.node?.closest("[data-route]"))) continue;
        w.__cls += entry.value;
        w.__sources.push(
          `${entry.value.toFixed(4)} ${entry.sources.map((s) => s.node?.nodeName + "." + s.node?.className).join(",")}`,
        );
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path);
  await scrollThrough(page);
  await settle(page);
  const result = await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __sources: string[] };
    return { __cls: w.__cls, __sources: w.__sources };
  });
  if (result.__cls > 0) console.log(`layout shifts on ${path}:\n${result.__sources.join("\n")}`);
  return result.__cls;
}

test.describe("lab page", () => {
  test.skip(remote, "the lab page is off on remote sites");

  test("criterion 9: shows the vertical, responsive, inline and static routes", async ({ page }) => {
    await page.goto(lab);
    await expect(page.getByRole("heading", { level: 1, name: "Route lab" })).toBeVisible();
    for (const id of ["vertical", "horizontal", "inline", "static"]) {
      await expect(page.getByTestId(`lab-${id}`).locator("[data-route]")).toHaveCount(1);
    }
    await expect(page.getByTestId("lab-vertical").locator("[data-route-pin]")).toHaveCount(7);
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  });

  for (const width of [360, 375]) {
    test(`criterion 11: no sideways scroll at ${width}, before and after drawing`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of [lab, "/"]) {
        await page.goto(path);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        await scrollThrough(page);
        await settle(page);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
      }
    });
  }

  test("criterion 12: layout shift stays below 0.001 on the lab page and home", async ({ page }) => {
    expect(await layoutShift(page, lab)).toBeLessThan(0.001);
  });

  test("criterion 15: pins below the fold are reached only when scrolled to, in order", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto(lab);
    const reached = () =>
      page
        .getByTestId("lab-vertical")
        .locator("[data-route-pin]")
        .evaluateAll((pins) => pins.map((p) => p.hasAttribute("data-reached")));
    await expect.poll(async () => (await reached())[0]).toBe(true);
    expect((await reached()).at(-1)).toBe(false);
    await page.getByTestId("lab-vertical").locator("[data-route-pin]").last().scrollIntoViewIfNeeded();
    await expect.poll(async () => (await reached()).at(-1)).toBe(true);
    const state = await reached();
    expect(state.indexOf(false)).toBe(-1);
    // Order: once a pin is reached every pin before it is.
    expect(state.join()).toBe(
      state
        .slice()
        .sort((a, b) => Number(b) - Number(a))
        .join(),
    );
  });

  test("criterion 19: the route adds no tab stops", async ({ page }) => {
    await page.goto(lab);
    const count = await page.evaluate(
      () =>
        document.querySelectorAll("[data-route] :is(a, button, input, select, textarea, [tabindex])").length,
    );
    expect(count).toBe(0);
  });

  test("criterion 20: the lab page passes axe", async ({ page }) => {
    await page.goto(lab);
    await scrollThrough(page);
    await settle(page);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("lab page absent on remote sites", () => {
  test.skip(!remote, "only meaningful against a deployed site");
  test("criterion 10: /_lab/route answers 404", async ({ request }) => {
    const response = await request.get(lab);
    expect(response.status()).toBe(404);
  });
});

test.describe("home journey", () => {
  test("criterion 11: no sideways scroll on home at 360 and 375, before and after drawing", async ({
    page,
  }) => {
    for (const width of [360, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      await page.locator("#journey").scrollIntoViewIfNeeded();
      await settle(page);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    }
  });

  test("criterion 12: home layout shift stays below 0.001", async ({ page }) => {
    expect(await layoutShift(page, "/")).toBeLessThan(0.001);
  });

  test("criterion 13: only cheap properties animate", async ({ page }) => {
    await page.goto("/");
    await page.locator("#journey").scrollIntoViewIfNeeded();
    await expect(page.locator("#journey [data-route]")).toHaveAttribute("data-drawn", "");
    const properties = await page.evaluate(() => {
      const names = new Set<string>();
      for (const a of document.getAnimations()) {
        if (!document.querySelector("#journey")!.contains((a.effect as KeyframeEffect).target)) continue;
        if (a instanceof CSSTransition) names.add(a.transitionProperty);
        for (const frame of (a.effect as KeyframeEffect).getKeyframes()) {
          for (const key of Object.keys(frame)) {
            if (!["offset", "easing", "composite", "computedOffset"].includes(key)) names.add(key);
          }
        }
      }
      return [...names];
    });
    expect(properties.length).toBeGreaterThan(0);
    for (const property of properties) {
      expect(["stroke-dashoffset", "strokeDashoffset", "translate", "scale", "opacity"]).toContain(property);
    }
  });

  test("criterion 14: smoothness while the journey draws (desktop light)", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-light", "one project measures frames");
    // 1280 x 720: the journey is below the first screen, so scroll it in and sample
    // the frames from then until it has drawn, plus the whole draw time.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      const w = window as unknown as { __gaps: number[]; __sampling: boolean };
      w.__gaps = [];
      w.__sampling = true;
      let last = performance.now();
      const tick = (now: number) => {
        w.__gaps.push(now - last);
        last = now;
        if (w.__sampling) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.locator("#journey").scrollIntoViewIfNeeded();
    await expect(page.locator("#journey [data-route]")).toHaveAttribute("data-drawn", "");
    await page.waitForTimeout(3500); // four legs of 600 ms, the pins and the plane
    const gaps = await page.evaluate(() => {
      const w = window as unknown as { __gaps: number[]; __sampling: boolean };
      w.__sampling = false;
      return w.__gaps.slice(1);
    });
    gaps.sort((a, b) => a - b);
    const p95 = gaps[Math.floor(gaps.length * 0.95)] ?? 0;
    console.log(`journey frame interval p95: ${p95.toFixed(1)} ms over ${gaps.length} frames`);
    // 20 ms locally (60 fps with headroom); generous on CI, whose shared machines stall.
    expect(p95).toBeLessThanOrEqual(process.env.CI ? 33 : 20);
  });

  test("criterion 14b: a 4x CPU throttled performance trace of the journey draw", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-light", "one project records the trace");
    test.skip(Boolean(process.env.E2E_BASE_URL), "local only");
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const events: { name: string; ph: string; args?: unknown }[] = [];
    cdp.on("Tracing.dataCollected", (chunk) => events.push(...(chunk.value as typeof events)));
    const done = new Promise<void>((resolve) => cdp.once("Tracing.tracingComplete", () => resolve()));
    await cdp.send("Tracing.start", {
      transferMode: "ReportEvents",
      traceConfig: {
        includedCategories: [
          "devtools.timeline",
          "disabled-by-default-devtools.timeline",
          "cc",
          "viz",
          "benchmark",
        ],
      },
    });
    await page.locator("#journey").scrollIntoViewIfNeeded();
    await expect(page.locator("#journey [data-route]")).toHaveAttribute("data-drawn", "");
    await page.waitForTimeout(3500);
    await cdp.send("Tracing.end");
    await done;
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    mkdirSync(".artifacts/perf", { recursive: true });
    writeFileSync(".artifacts/perf/journey-4x-trace.json", JSON.stringify({ traceEvents: events }));
    // One PipelineReporter begin event per produced frame; its state says if it was dropped.
    const reported = events.filter((e) => e.name === "PipelineReporter" && e.ph === "b");
    const frames = reported.length;
    const dropped = reported.filter((e) => JSON.stringify(e.args).includes("STATE_DROPPED")).length;
    console.log(`4x CPU trace: ${dropped} dropped of ${frames} frames, ${events.length} trace events`);
    expect(events.length).toBeGreaterThan(0);
  });

  test("criterion 18: at 1440 the journey draw starts after the hero plane lands", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      const w = window as unknown as { __drawnAt?: number };
      new MutationObserver(() => {
        if (w.__drawnAt === undefined && document.querySelector("#journey [data-drawn]")) {
          w.__drawnAt = performance.now();
        }
      }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-drawn"] });
    });
    await page.goto("/");
    // The journey sits just below the first screen: scroll it in at once, so only
    // the "wait for the hero plane to land" rule can hold the drawing back.
    await page.locator("#journey").scrollIntoViewIfNeeded();
    await expect(page.locator("#journey [data-route]")).toHaveAttribute("data-drawn", "");
    const times = await page.evaluate(() => {
      const plane = document
        .getAnimations()
        .find((a) => (a as CSSAnimation).animationName === "mini-route-flight")!;
      const timing = plane.effect!.getComputedTiming();
      return {
        planeEnd: (plane.startTime as number) + Number(timing.delay) + Number(timing.duration),
        drawnAt: (window as unknown as { __drawnAt: number }).__drawnAt,
      };
    });
    expect(times.drawnAt).toBeGreaterThanOrEqual(times.planeEnd - 1);
  });

  test("criterion 16: with reduced motion the route is finished and nothing animates", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const state = await page.locator("#journey").evaluate((section) => {
      const line = section.querySelector<SVGElement>(".route-mask-line")!;
      const pin = section.querySelector<HTMLElement>(".route-pin")!;
      const vehicle = section.querySelector<HTMLElement>(".route-vehicle")!;
      const delays = [line, pin, vehicle].map((el) => getComputedStyle(el).transitionDelay);
      return {
        offset: getComputedStyle(line).strokeDashoffset,
        pinScale: getComputedStyle(pin).scale,
        vehicleTranslate: getComputedStyle(vehicle).translate,
        vehicleOpacity: getComputedStyle(vehicle).opacity,
        running: section.getAnimations({ subtree: true }).length,
        delays,
      };
    });
    expect(state.offset).toBe("0px");
    expect(state.pinScale).toBe("none");
    expect(state.vehicleTranslate).toBe("none");
    expect(state.vehicleOpacity).toBe("1");
    expect(state.running).toBe(0);
    expect(state.delays.every((d) => parseFloat(d) === 0)).toBe(true);
    await context.close();
  });

  test("criterion 17: with JavaScript off the whole route is there and the plane is at Scale", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const state = await page.locator("#journey").evaluate((section) => {
      const line = section.querySelector<SVGElement>(".route-mask-line")!;
      const vehicle = section.querySelector<HTMLElement>(".route-vehicle")!;
      return {
        armed: section.querySelector("[data-route]")!.hasAttribute("data-armed"),
        offset: getComputedStyle(line).strokeDashoffset,
        opacity: getComputedStyle(vehicle).opacity,
        translate: getComputedStyle(vehicle).translate,
        pins: section.querySelectorAll("[data-route-pin]").length,
      };
    });
    expect(state).toEqual({ armed: false, offset: "0px", opacity: "1", translate: "none", pins: 5 });
    await context.close();
  });

  test("criterion 17b: if the script never loads, the route is finished", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/");
    const state = await page.locator("#journey").evaluate((section) => {
      const root = section.querySelector("[data-route]")!;
      const line = section.querySelector<SVGElement>(".route-mask-line")!;
      const pin = section.querySelector<HTMLElement>(".route-pin")!;
      return {
        armed: root.hasAttribute("data-armed"),
        offset: getComputedStyle(line).strokeDashoffset,
        pinScale: getComputedStyle(pin).scale,
      };
    });
    expect(state).toEqual({ armed: false, offset: "0px", pinScale: "none" });
  });

  for (const project of ["desktop-light", "desktop-dark", "mobile"]) {
    test(`criterion 20: home passes axe with the journey drawn (${project})`, async ({ page }) => {
      test.skip(test.info().project.name !== project, "runs once per project");
      await page.goto("/");
      await page.locator("#journey").scrollIntoViewIfNeeded();
      await settle(page);
      const results = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
