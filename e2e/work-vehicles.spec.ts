import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The vehicles on /work (#66): the Lagos danfo, the paper plane on the handover leg and the
// London bus beside HBK. The rows come from the fake Supabase server (e2e/fixtures), so the
// route is HBK, Deimos (three clients), Stanbic IBTC, Access Bank, Galooli.
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

const visibleDanfos = (page: Page) =>
  page.locator("[data-vehicle='danfo']").evaluateAll((slots) =>
    slots
      .filter((slot) => Number(getComputedStyle(slot).opacity) > 0.99)
      .map((slot) => ({
        at: slot.getAttribute("data-parked-at"),
        door: slot.getAttribute("data-door"),
        side: getComputedStyle(slot.querySelector(".vehicle-side")!).display !== "none",
        pin: getComputedStyle(slot.querySelector(".vehicle-pin")!).display !== "none",
      })),
  );

async function scrollToEnd(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 300) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
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

// The pin counts as reached above the lower 40% of the screen: put it at 30% from the top.
const showHbk = (page: Page) =>
  page.locator("[data-route-pin='hbk']").evaluate((pin) => {
    window.scrollTo(0, pin.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3);
  });

const box = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, left: r.left, right: r.right };
    });

test.describe("work vehicles", () => {
  test("after scrolling, one danfo shows at the latest reached Lagos pin with its door open", async ({
    page,
  }) => {
    await page.goto("/work");
    await expect(page.locator("[data-route][data-armed]")).toHaveCount(1);
    // Put Stanbic IBTC near the top: Galooli's pin is still below the trigger line on a short
    // screen, so the latest Lagos pin reached is Stanbic IBTC or later; scroll on to Galooli.
    await scrollToEnd(page);
    await settle(page);
    await expect.poll(() => visibleDanfos(page)).toHaveLength(1);
    const [danfo] = await visibleDanfos(page);
    expect(danfo).toMatchObject({ at: "galooli", door: "open" });
    await expect(page.locator("[data-vehicle='danfo'][data-latest]")).toHaveCount(1);
  });

  test("the danfo is only ever at a Lagos entry, never at HBK", async ({ page }) => {
    await page.goto("/work");
    await scrollToEnd(page);
    const at = await page
      .locator("[data-vehicle='danfo']")
      .evaluateAll((slots) => slots.map((slot) => slot.getAttribute("data-parked-at")));
    expect(at).toEqual(["Deimos", "stanbic-ibtc", "access-bank", "galooli"]);
  });

  test("the plane rides the handover leg from the Deimos entry up to HBK, nose up", async ({ page }) => {
    await page.goto("/work");
    await showHbk(page);
    await expect(page.locator("[data-route-pin='hbk'][data-reached]")).toHaveCount(1);
    await settle(page);
    const plane = await box(page, "[data-vehicle='plane']");
    const hbk = await box(page, "[data-route-pin='hbk']");
    const deimos = await box(page, "[data-route-pin='Deimos']");
    expect(plane.top).toBeGreaterThanOrEqual(hbk.bottom - 1);
    expect(plane.bottom).toBeLessThanOrEqual(deimos.top + 1);
    const turn = await page.locator("[data-vehicle='plane']").evaluate((el) => getComputedStyle(el).rotate);
    expect(turn).toBe("-90deg");
  });

  test("the bus waits beside HBK, at its pin's top", async ({ page }) => {
    await page.goto("/work");
    await showHbk(page);
    await expect(page.locator("[data-route-pin='hbk'][data-reached]")).toHaveCount(1);
    await settle(page);
    const bus = page.locator("[data-vehicle='bus']");
    await expect.poll(() => bus.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
    const entry = await box(page, "#hbk");
    const busBox = await box(page, "[data-vehicle='bus']");
    // A phone's 32 px disc overhangs the 20 px pin by 6 px on every side.
    expect(busBox.top).toBeGreaterThanOrEqual(entry.top - 7);
    expect(busBox.top).toBeLessThanOrEqual(entry.bottom);
  });

  test("phones show the 32 px round pins, wider screens the side views", async ({ page }, testInfo) => {
    await page.goto("/work");
    await scrollToEnd(page);
    await settle(page);
    const [danfo] = await visibleDanfos(page);
    const narrow = (page.viewportSize()?.width ?? 0) < 768;
    expect(danfo).toMatchObject(narrow ? { pin: true, side: false } : { pin: false, side: true });
    if (narrow) {
      const size = await page.locator("[data-vehicle='danfo'][data-latest] .vehicle-pin").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
      expect(size).toEqual({ w: 32, h: 32 });
    }
    void testInfo;
  });

  test("changes no layout: vehicles are positioned out of flow and shift nothing (CLS 0)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/work");
    await scrollToEnd(page);
    await settle(page);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
    const positions = await page
      .locator("[data-vehicle]")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
    expect(positions.every((p) => p === "absolute" || p === "static")).toBe(true);
    const parked = await page
      .locator(".route-parked")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
    expect(new Set(parked)).toEqual(new Set(["absolute"]));
  });

  test("has no sideways scroll", async ({ page }) => {
    await page.goto("/work");
    await scrollToEnd(page);
    await settle(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(0);
  });

  test("has no accessibility violations once the vehicles are in place", async ({ page }) => {
    await page.goto("/work");
    await page.evaluate(() => document.fonts.ready);
    await scrollToEnd(page);
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });

  test("offers a hook for filters: data-vehicles hidden removes every vehicle", async ({ page }) => {
    await page.goto("/work");
    await page.evaluate(() =>
      document.querySelector("[data-route]")!.setAttribute("data-vehicles", "hidden"),
    );
    const shown = await page
      .locator(".route-parked, .route-vehicle")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).display));
    expect(new Set(shown)).toEqual(new Set(["none"]));
  });
});

test.describe("work vehicles with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("parks the danfo at the Deimos entry, door open, the plane at rest and the bus at HBK, all still", async ({
    page,
  }) => {
    await page.goto("/work");
    await scrollToEnd(page);
    await page.waitForTimeout(200);
    expect(await visibleDanfos(page)).toEqual([expect.objectContaining({ at: "Deimos", door: "open" })]);
    await expect(page.locator("[data-vehicle][data-latest]")).toHaveCount(0);
    const bus = await page.locator("[data-vehicle='bus']").evaluate((el) => getComputedStyle(el).opacity);
    expect(bus).toBe("1");
    const door = await page
      .locator("[data-vehicle='danfo'][data-home] .vehicle-door")
      .evaluate((el) => getComputedStyle(el).translate);
    expect(door).not.toBe("none");
    const moves = await page
      .locator(".route-parked")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).transitionDuration));
    expect(moves.every((d) => /^(0|1e-05)s$/.test(d.split(",")[0]!.trim()))).toBe(true);
  });
});

test.describe("work vehicles without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("parks the danfo at the Deimos entry with its door open, the plane on its leg, the bus at HBK", async ({
    page,
  }) => {
    await page.goto("/work");
    expect(await visibleDanfos(page)).toEqual([expect.objectContaining({ at: "Deimos", door: "open" })]);
    await expect(page.locator("[data-vehicle='plane']")).toBeVisible();
    const bus = await page.locator("[data-vehicle='bus']").evaluate((el) => getComputedStyle(el).opacity);
    expect(bus).toBe("1");
  });
});

test.describe("route lab vehicles", () => {
  test.skip(Boolean(process.env.E2E_BASE_URL), "the lab page is off on remote sites");

  test("shows the danfo, the plane and the bus on a small route", async ({ page }) => {
    await page.goto("/_lab/route");
    const lab = page.getByTestId("lab-vehicles");
    await expect(lab.locator("[data-route][data-armed]")).toHaveCount(1);
    await expect(lab.locator("[data-vehicle='danfo']")).toHaveCount(2);
    await expect(lab.locator("[data-vehicle='bus']")).toHaveCount(1);
    await expect(lab.locator("[data-vehicle='plane']")).toHaveCount(1);
    await lab.scrollIntoViewIfNeeded();
    await expect(lab.locator("[data-vehicle='danfo'][data-latest]")).toHaveCount(1);
  });
});
