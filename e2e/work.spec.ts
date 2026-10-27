import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Work page (#10, PR 2). The rows come from the fake Supabase server (e2e/fixtures/
// fake-content.mjs), which copies the seed. Flag and failure states are in flags.spec.ts.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const remote = Boolean(process.env.E2E_BASE_URL);
const list = (page: Page) => page.getByRole("region", { name: "Work, newest first" });
// A closed expander keeps its text in the page but clips it to nothing, which Playwright's
// visibility check does not see, so ask for the height of the clipping box.
const revealed = (text: string, page: Page) =>
  page
    .getByText(text)
    .evaluate((el) => (el.closest(".ticket-expander") as HTMLElement).getBoundingClientRect().height > 8);
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("work page", () => {
  test("has one h1, the Work title, the approved description and a canonical link", async ({ page }) => {
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Work");
    await expect(page).toHaveTitle(/^Work \|/);
    await expect(
      page.getByText(
        "Technical and engineering roles across AI and engineering software, cross-border payments, edtech, banking and IoT, newest first.",
      ),
    ).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Technical and engineering roles across AI and engineering software, cross-border payments, edtech, banking and IoT, from Galooli to HBK.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/work$/);
  });

  test("lists the stops newest first, with the Deimos group and role over years eyebrows", async ({
    page,
  }) => {
    await page.goto("/work");
    const stops = list(page);
    await expect(stops.getByRole("heading", { level: 2 })).toHaveText([
      "HBK",
      "Deimos, Senior Software Engineer, 2022 to 2024",
      "Stanbic IBTC",
      "Access Bank",
      "Galooli",
    ]);
    await expect(stops.getByRole("heading", { level: 3 })).toHaveText(["Mukuru", "uLesson", "Optty"]);
    await expect(stops.getByText("via Deimos", { exact: true })).toHaveCount(3);
    // The rail carries each stop's years and role; the Deimos years appear once, in its rail entry.
    const rail = (key: string) => page.locator(`[data-work-entry="${key}"] [data-rail]`);
    await expect(rail("hbk")).toHaveText("2024 to nowBackend Software Engineer");
    await expect(rail("galooli")).toHaveText("2016 to 2018Technical Support Engineer");
    await expect(rail("Deimos")).toHaveText("2022 to 2024Senior Software EngineerDeimos · 3 clients");
    await expect(stops.getByText("2022 to 2024", { exact: true })).toHaveCount(1);
    // No role or years eyebrow repeats on a ticket: only the Deimos clients have one.
    await expect(stops.locator(".ticket p.label-mono")).toHaveText([
      "via Deimos",
      "via Deimos",
      "via Deimos",
    ]);
    await expect(stops.locator("li[id]")).toHaveCount(7);
  });

  test("shows the three flagship figures as source links and links no case study", async ({ page }) => {
    test.skip(remote, "the flags of a live site decide the case study links");
    await page.goto("/work");
    const figures = list(page)
      .locator(".ticket-stub")
      .getByRole("link", { name: /\(source: / });
    await expect(figures).toHaveCount(3);
    for (const figure of await figures.all()) {
      await expect(figure).toHaveAttribute("href", /^https:/);
      await expect(figure).toHaveAttribute("target", "_blank");
      expect((await figure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(list(page).locator('a[href^="/work/"]')).toHaveCount(0);
    await expect(list(page).locator("[data-linked]")).toHaveCount(0);
  });

  test("expands a compact ticket with the keyboard, focus staying on the button", async ({ page }) => {
    await page.goto("/work");
    const detailText = "Mentored junior engineers on the team.";
    const detail = page.getByText(detailText);
    const button = page.getByRole("button", { name: "Read more about Stanbic IBTC" });
    await button.focus();
    await expect(button).toBeFocused();
    await expect.poll(() => revealed(detailText, page)).toBe(false);
    await page.keyboard.press("Enter");
    const open = page.getByRole("button", { name: "Show less about Stanbic IBTC" });
    await expect(open).toBeFocused();
    await expect(open).toHaveAttribute("aria-expanded", "true");
    await expect(detail).toBeVisible();
    await expect.poll(() => revealed(detailText, page)).toBe(true);
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Read more about Stanbic IBTC" })).toBeFocused();
    await expect.poll(() => revealed(detailText, page)).toBe(false);
  });

  test("Tab reaches every Read more button in order", async ({ page }) => {
    await page.goto("/work");
    const names: string[] = [];
    for (let index = 0; index < 60 && names.length < 4; index += 1) {
      await page.keyboard.press("Tab");
      const name = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("aria-label") ?? el?.textContent?.trim() ?? "";
      });
      if (name.startsWith("Read more about")) names.push(name);
    }
    expect(names).toEqual([
      "Read more about Mukuru",
      "Read more about uLesson",
      "Read more about Stanbic IBTC",
      "Read more about Galooli",
    ]);
  });

  test("opens the deep-linked ticket below the sticky header, and ignores an unknown anchor", async ({
    page,
  }) => {
    await page.goto("/work#mukuru");
    await expect(page.getByRole("button", { name: "Show less about Mukuru" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByText("Added value-added services for remittance customers")).toBeVisible();
    await expect
      .poll(async () => {
        const [header, ticket] = await Promise.all([
          page.getByRole("banner").boundingBox(),
          page.locator("li#mukuru").boundingBox(),
        ]);
        return ticket!.y - (header!.y + header!.height);
      })
      .toBeGreaterThanOrEqual(0);
    await page.goto("/work#nope");
    await expect(page.getByRole("button", { name: /^Show less/ })).toHaveCount(0);
  });

  test("a deep link causes no layout shift (CLS under 0.05 on /work#galooli)", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/work#galooli");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("button", { name: "Show less about Galooli" })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
  });

  for (const width of [320, 360, 375]) {
    test(`does not scroll sideways at ${width} px, even with every ticket open`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/work");
      for (const name of ["Mukuru", "uLesson", "Stanbic IBTC", "Galooli"]) {
        await page.getByRole("button", { name: `Read more about ${name}` }).click();
      }
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test("has no Lab band and no link to /lab", async ({ page }) => {
    await page.goto("/work");
    await expect(page.getByText("In the lab")).toHaveCount(0);
    await expect(page.getByText("Foresight")).toHaveCount(0);
    await expect(page.locator('main a[href="/lab"]')).toHaveCount(0);
  });

  test("lays out a rail and tickets in two columns from md, one title size, tickets at most 760 px", async ({
    page,
  }, testInfo) => {
    test.skip(
      (testInfo.project.use.viewport?.width ?? 0) < 1100,
      "the 300 and 760 px columns need a wide screen",
    );
    await page.goto("/work");
    const stops = page.locator("[data-work-entry]");
    for (const entry of await stops.all()) {
      const [rail, ticket] = await Promise.all([
        entry.boundingBox(),
        entry.locator(".ticket").first().boundingBox(),
      ]);
      // The ticket starts after the 300 px rail column and the 40 px gap.
      expect(ticket!.x - rail!.x).toBeCloseTo(340, 0);
      expect(ticket!.width).toBeLessThanOrEqual(760);
    }
    const sizes = await page
      .locator("[data-work-entry] .ticket h2, [data-work-entry] .ticket h3")
      .evaluateAll((titles) => titles.map((title) => getComputedStyle(title).fontSize));
    expect(sizes).toHaveLength(7);
    expect(new Set(sizes).size).toBe(1);
    const weights = await page
      .locator("[data-work-entry] .ticket h2, [data-work-entry] .ticket h3")
      .evaluateAll((titles) => titles.map((title) => getComputedStyle(title).fontWeight));
    expect(new Set(weights).size).toBe(1);
  });

  test("keeps the rail above the ticket on phones, with the dotted line down the left edge", async ({
    page,
  }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 768, "phones only");
    await page.goto("/work");
    const entry = page.locator('[data-work-entry="stanbic-ibtc"]');
    const [rail, ticket, pin] = await Promise.all([
      entry.locator("[data-rail]").boundingBox(),
      entry.locator(".ticket").boundingBox(),
      entry.locator("[data-route-pin]").boundingBox(),
    ]);
    expect(rail!.y + rail!.height).toBeLessThanOrEqual(ticket!.y);
    expect(pin!.x).toBeLessThan(ticket!.x);
    // The leg of the route (the dotted line) is the pin's, running down the entry.
    await expect(entry.locator("[data-route-leg]")).toHaveCount(1);
  });

  test("the pins: teal for the current stop, lilac for the first, paper for the others", async ({ page }) => {
    await page.goto("/work");
    const colour = (key: string) =>
      page
        .locator(`[data-work-entry="${key}"] [data-route-pin]`)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    const [hbk, galooli, stanbic] = await Promise.all([
      colour("hbk"),
      colour("galooli"),
      colour("stanbic-ibtc"),
    ]);
    expect(new Set([hbk, galooli, stanbic]).size).toBe(3);
    // The oldest stop ends the line: no leg after it.
    await expect(page.locator('[data-work-entry="galooli"] [data-route-leg]')).toHaveCount(0);
    await expect(page.locator("[data-route-leg]")).toHaveCount(4);
  });

  test("Home's tickets link to their place on /work", async ({ page }) => {
    test.skip(remote, "the flags of a live site decide the links");
    await page.goto("/");
    const hrefs = await page
      .locator("#selected-stops h3 a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toEqual(["/work#mukuru", "/work#optty", "/work#access-bank"]);
  });

  test("with reduced motion the expander changes without a transition", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ ...testInfo.project.use, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/work");
    const region = page.locator(".ticket-expander").first();
    // The global reduced motion rule makes every transition 0.01 ms.
    expect(await region.evaluate((el) => getComputedStyle(el).transitionDuration)).toMatch(/^(0|1e-05)s$/);
    await page.getByRole("button", { name: "Read more about Mukuru" }).click();
    await expect(page.getByText("Added value-added services for remittance customers")).toBeVisible();
    await context.close();
  });

  test("has no accessibility violations, closed and with a ticket open", async ({ page }) => {
    await page.goto("/work");
    await page.evaluate(() => document.fonts.ready);
    let results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
    await page.getByRole("button", { name: "Read more about Galooli" }).click();
    await expect(page.getByText("Deployed IoT energy management")).toBeVisible();
    // Back to the top, so the sticky header does not sit over a button when axe measures targets.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("work page without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows every detail and outcome, with no Read more buttons", async ({ page }) => {
    await page.goto("/work");
    await expect(list(page).getByRole("button")).toHaveCount(0);
    for (const text of [
      "Deployed IoT energy management for telecom tower operators across Nigeria.",
      "Mentored junior engineers on the team.",
      "Redesigned the uLesson web platform so pages load faster and learning flows read more clearly.",
      "Added value-added services for remittance customers alongside transfers.",
    ]) {
      await expect(page.getByText(text)).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /17M\+/ })).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});
