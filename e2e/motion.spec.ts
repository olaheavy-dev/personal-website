import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Journey micro-motions (issue #69): the hero name sweep, the footer stub lift
// and the printed boarding pass. Numbers in test names are the plan's acceptance
// criteria.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

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

function emailMe(page: Page) {
  return page.locator("footer").getByRole("link", { name: /Email me/ });
}

async function canHover(page: Page) {
  return page.evaluate(() => matchMedia("(hover: hover)").matches);
}

// Reach Email me with real Tab presses, the way a keyboard visitor would.
async function tabToEmailMe(page: Page) {
  const link = emailMe(page);
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    if (await link.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error("Email me was not reached by Tab");
}

// Lift the stub the way this device can: hover, or keyboard focus on touch devices.
async function liftStub(page: Page) {
  if (await canHover(page)) await emailMe(page).hover();
  else await tabToEmailMe(page);
}

async function stubRotate(page: Page) {
  return page.locator("footer .ticket-stub").evaluate((el) => getComputedStyle(el).rotate);
}

async function layoutBoxes(page: Page) {
  return page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector)!;
      return selector === "footer .ticket"
        ? [el.offsetLeft, el.offsetWidth, el.offsetHeight]
        : [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight];
    };
    return {
      ticket: read("footer .ticket"),
      body: read("footer .ticket-body"),
      stub: read("footer .ticket-stub"),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
}

test.describe("hero name sweep", () => {
  test("criterion 1: the sweep ends no later than takeoff and plays once", async ({ page }) => {
    await page.goto("/");
    const timings = await page.evaluate(() => {
      const ms = (value: string) => parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
      const name = document.querySelector<HTMLElement>(".name-sweep")!;
      const sweep = getComputedStyle(name, "::before");
      const plane = getComputedStyle(document.querySelector<HTMLElement>(".mini-route-plane")!);
      return {
        name: sweep.animationName,
        sweepEnd: ms(sweep.animationDuration) + ms(sweep.animationDelay),
        iterations: sweep.animationIterationCount,
        planeStart: ms(plane.animationDelay),
      };
    });
    expect(timings.name).toBe("name-sweep");
    expect(timings.iterations).toBe("1");
    expect(timings.sweepEnd).toBeGreaterThan(0);
    expect(timings.sweepEnd).toBeLessThanOrEqual(timings.planeStart);
  });

  test("criterion 25: the ink boundary and the lilac edge share one timeline and stay together", async ({
    page,
  }) => {
    // Freeze the document timeline (Chromium) so the 400 ms sweep can be inspected frame by frame.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Animation.enable");
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
    await page.goto("/");
    const frames = await page.evaluate(() => {
      const named = (name: string) =>
        document.getAnimations().find((a) => (a as CSSAnimation).animationName === name)!;
      const clip = named("name-sweep");
      const ink = named("name-ink");
      const timing = (a: Animation) => {
        const t = a.effect!.getTiming();
        const c = a.effect!.getComputedTiming();
        return { duration: c.duration, delay: t.delay, easing: t.easing, iterations: t.iterations };
      };
      const total = Number(clip.effect!.getComputedTiming().duration);
      const name = document.querySelector<HTMLElement>(".name-sweep")!;
      const out = [];
      for (const fraction of [0.25, 0.5, 0.75]) {
        clip.pause();
        ink.pause();
        clip.currentTime = ink.currentTime = total * fraction;
        // Revealed share of the span (clip inset right goes 100% to 0) and the gradient edge
        // position (background-position 100% to 0, edge at 1 - p of the padding box).
        const inset = parseFloat(
          getComputedStyle(name, "::before").clipPath.split(/[ (]/).filter(Boolean)[2] ?? "0",
        );
        const position = parseFloat(
          getComputedStyle(name.querySelector(".name-sweep-text")!).backgroundPositionX,
        );
        out.push({ fraction, revealed: 1 - inset / 100, inkEdge: 1 - position / 100 });
      }
      return { clip: timing(clip), ink: timing(ink), out };
    });
    expect(frames.ink).toEqual(frames.clip);
    expect(frames.clip.iterations).toBe(1);
    for (const frame of frames.out) {
      expect(frame.inkEdge).toBeCloseTo(frame.revealed, 2);
      expect(frame.revealed).toBeGreaterThan(0);
      expect(frame.revealed).toBeLessThan(1);
    }
  });

  for (const width of [360, 1440]) {
    test(`criterion 25: capture of the sweep mid flight in dark at ${width}`, async ({ page }) => {
      test.skip(test.info().project.name !== "desktop-dark", "one project captures it");
      await page.setViewportSize({ width, height: 700 });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Animation.enable");
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
      await page.goto("/");
      await page.evaluate(() => {
        for (const a of document.getAnimations()) {
          const name = (a as CSSAnimation).animationName;
          if (name === "name-sweep" || name === "name-ink") {
            a.pause();
            a.currentTime = 50;
          }
        }
      });
      await page.screenshot({
        path: `.artifacts/motion/sweep-mid-dark-${width}.png`,
        clip: { x: 0, y: 150, width, height: 330 },
      });
    });
  }

  test("criterion 2: the name is visible from first paint", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    const name = page.locator(".name-sweep");
    await name.waitFor({ state: "attached" });
    const state = await name.evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, visibility: style.visibility, display: style.display };
    });
    expect(state).toEqual({ opacity: "1", visibility: "visible", display: "inline-block" });
    const before = await getComputedStyleOpacity(page);
    expect(before).toBe("1");
  });

  test("criterion 3: the hero passes axe once the motion has settled", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const results = await new AxeBuilder({ page })
      .include("section[aria-labelledby='hero-title']")
      .withTags(tags)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("criterion 5: the sweep causes no layout shift", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as {
              value: number;
              hadRecentInput: boolean;
            }[]) {
              if (!entry.hadRecentInput) total += entry.value;
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 300);
        }),
    );
    expect(shift).toBeLessThan(0.01);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("criterion 4: shows the finished highlight with nothing running", async ({ page }) => {
      await page.goto("/");
      const state = await page.locator(".name-sweep").evaluate((el) => {
        const layer = getComputedStyle(el, "::before");
        return {
          animation: layer.animationName,
          clip: layer.clipPath,
          background: layer.backgroundColor,
          running: el.getAnimations({ subtree: true }).length,
        };
      });
      expect(state.animation).toBe("none");
      expect(state.clip).toBe("none");
      expect(state.background).not.toBe("rgba(0, 0, 0, 0)");
      expect(state.running).toBe(0);
    });
  });
});

async function getComputedStyleOpacity(page: Page) {
  return page.locator(".name-sweep").evaluate((el) => {
    let node: Element | null = el;
    let opacity = 1;
    while (node) {
      opacity *= parseFloat(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    return String(opacity);
  });
}

test.describe("footer stub lift", () => {
  for (const viewport of [
    { name: "1440", width: 1440, height: 900 },
    { name: "375", width: 375, height: 800 },
  ]) {
    test(`criterion 6: lifts on Email me hover and settles on leave at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await emailMe(page).scrollIntoViewIfNeeded();
      expect(await stubRotate(page)).toBe("none");
      await liftStub(page);
      await expect.poll(() => stubRotate(page)).not.toBe("none");
      await page.mouse.move(2, 2);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await expect.poll(() => stubRotate(page)).toBe("none");
    });
  }

  test("criterion 7: lifts on keyboard focus", async ({ page }) => {
    await page.goto("/");
    const link = emailMe(page);
    await link.scrollIntoViewIfNeeded();
    await tabToEmailMe(page);
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    await expect.poll(() => stubRotate(page)).not.toBe("none");
  });

  test("criterion 9: no sideways scroll at 375 px with the stub lifted", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await emailMe(page).scrollIntoViewIfNeeded();
    // Before any click the empty status region must already sit inside the ticket.
    const check = async () => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    };
    await check();
    const inside = await page.evaluate(() => {
      const region = document
        .querySelector("footer [data-testid='copy-email-status']")!
        .getBoundingClientRect();
      const ticket = document.querySelector("footer .ticket")!.getBoundingClientRect();
      return region.left >= ticket.left - 0.5 && region.right <= ticket.right + 0.5;
    });
    expect(inside).toBe(true);
    await liftStub(page);
    await expect.poll(() => stubRotate(page)).not.toBe("none");
    await check();
  });

  test("criterion 11: the lift moves no layout", async ({ page }) => {
    await page.goto("/");
    // Let late content (fonts, lazy images) finish, so only the hover can move things.
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    // Sections above the footer render lazily as it scrolls into view and change the
    // page height, so measure the ticket's own boxes (the body and stub are relative to it).
    await emailMe(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const before = await layoutBoxes(page);
    const buttonBefore = await emailMe(page).boundingBox();
    await liftStub(page);
    await expect.poll(() => stubRotate(page)).not.toBe("none");
    expect(await layoutBoxes(page)).toEqual(before);
    // Sub-pixel scroll settling can move the button by a hundredth of a pixel; a layout shift would be whole pixels.
    const buttonAfter = await emailMe(page).boundingBox();
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(buttonAfter![key]).toBeCloseTo(buttonBefore![key], 0);
    }
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("criterion 8: no lift on hover or focus", async ({ page }) => {
      await page.goto("/");
      await emailMe(page).scrollIntoViewIfNeeded();
      await emailMe(page).hover();
      await page.waitForTimeout(400);
      expect(await stubRotate(page)).toBe("none");
      await emailMe(page).focus();
      await page.waitForTimeout(400);
      expect(await stubRotate(page)).toBe("none");
    });
  });
});

test.describe("boarding pass", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  });

  test("criterion 9b: the printed pass fits the viewport at 375 px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Copy email" }).click();
    await expect(page.locator("footer .boarding-pass")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("criterion 18: Copy email works from the keyboard and keeps focus", async ({ page }) => {
    await page.goto("/");
    const copy = page.getByRole("button", { name: "Copy email" });
    await copy.scrollIntoViewIfNeeded();
    await copy.focus();
    await page.keyboard.press("Enter");
    const pass = page.locator("footer [role='status']");
    await expect(pass).toContainText("Next stop: your email");
    await expect(pass).toContainText(/Email copied|Select to copy/);
    await expect(copy).toBeFocused();
  });

  test("criterion 19: the printed pass passes axe", async ({ page }) => {
    await page.goto("/");
    const copy = page.getByRole("button", { name: "Copy email" });
    await copy.scrollIntoViewIfNeeded();
    await copy.click();
    await expect(page.locator("footer .boarding-pass")).toBeVisible();
    await settle(page);
    const results = await new AxeBuilder({ page }).include("footer").withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("criterion 20: the pass appears instantly", async ({ page }) => {
      await page.goto("/");
      const copy = page.getByRole("button", { name: "Copy email" });
      await copy.scrollIntoViewIfNeeded();
      await copy.click();
      const pass = page.locator("footer .boarding-pass");
      await expect(pass).toBeVisible();
      const state = await pass.evaluate((el) => ({
        animation: getComputedStyle(el).animationName,
        running: el.getAnimations().length,
        clip: getComputedStyle(el).clipPath,
      }));
      expect(state).toEqual({ animation: "none", running: 0, clip: "none" });
    });
  });
});
