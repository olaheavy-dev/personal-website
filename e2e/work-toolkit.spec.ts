import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Toolkit section of /work (#10): one ticket, six groups, 37 tools as chips.

const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const groups = {
  "Languages and frameworks": ["C#", ".NET", "Python", "TypeScript", "FastAPI", "React", "Next.js"],
  AI: [
    "Microsoft Foundry",
    "Microsoft Agent Framework",
    "Amazon Bedrock",
    "Claude API",
    "Claude Agent SDK",
    "OpenAI API",
    "LangChain",
    "LangGraph",
    "LangSmith",
  ],
  Data: ["PostgreSQL", "Microsoft SQL Server", "MongoDB", "Redis", "Qdrant"],
  "Cloud and infrastructure": [
    "Microsoft Azure",
    "Amazon Web Services",
    "Google Cloud",
    "Terraform",
    "Docker",
    "Cloudflare",
  ],
  "Testing and evaluation": [
    "xUnit",
    "Reqnroll",
    "pytest",
    "Playwright",
    "Ragas",
    "Microsoft.Extensions.AI.Evaluation",
  ],
  Delivery: ["GitHub", "GitHub Actions", "GitLab", "Azure DevOps"],
};
const allNames = Object.values(groups).flat();
const toolkit = (page: Page) => page.getByRole("region", { name: "Toolkit" });
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const chip = (page: Page, name: string) =>
  page
    .locator(".toolkit-chip")
    .filter({ has: page.getByText(name, { exact: true }).or(page.getByAltText(name, { exact: true })) })
    .first();
const hoverable = (page: Page) => page.evaluate(() => matchMedia("(hover: hover)").matches);
const transformOf = (page: Page, name: string) =>
  chip(page, name).evaluate((el) => getComputedStyle(el).transform);

test.describe("work toolkit", () => {
  test("has the Toolkit heading, six labelled groups and all 37 tool names", async ({ page }) => {
    await page.goto("/work");
    const section = toolkit(page);
    await expect(section.getByRole("heading", { level: 2 })).toHaveText("Toolkit");
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(Object.keys(groups));
    expect(allNames).toHaveLength(37);
    for (const [group, names] of Object.entries(groups)) {
      const list = section.getByRole("list", { name: group, exact: true });
      await expect(list.getByRole("listitem")).toHaveCount(names.length);
      for (const name of names)
        await expect(
          list.getByText(name, { exact: true }).or(list.getByAltText(name, { exact: true })),
        ).toBeVisible();
    }
    // No intro line, no counts, no group numbers: the section is the heading and the ticket.
    await expect(section.getByText(/\d+ tools|^0\d$/)).toHaveCount(0);
  });

  test("sits after the timeline, with a notch pair on each divider and none after the last group", async ({
    page,
  }) => {
    await page.goto("/work");
    const order = await page.evaluate(() => {
      const route = document.querySelector('section[aria-label="Work, newest first"]')!;
      const kit = document.querySelector("[data-toolkit]")!;
      return Boolean(route.compareDocumentPosition(kit) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order).toBe(true);
    await expect(page.locator(".toolkit-notch")).toHaveCount(10);
    await expect(page.locator(".toolkit-group").last().locator(".toolkit-notch")).toHaveCount(2);
    // The last group carries its own top notches only, and the ticket has no stub or line below it.
    await expect(page.locator(".toolkit-ticket .ticket-stub")).toHaveCount(0);
  });

  test("keeps the plates out of the accessibility tree and serves every logo file", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator(".toolkit-plate[aria-hidden='true']")).toHaveCount(36);
    // The Redis wordmark is the chip's name, so it is the one logo assistive technology reads.
    await expect(toolkit(page).getByRole("img")).toHaveCount(1);
    await expect(toolkit(page).getByRole("img", { name: "Redis" })).toBeVisible();
    const sources = await page
      .locator(".toolkit-plate img")
      .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")));
    expect(sources).toHaveLength(10);
    for (const src of sources) {
      const response = await page.request.get(src!);
      expect(response.status(), src!).toBe(200);
      expect(response.headers()["content-type"], src!).toContain("image/svg+xml");
    }
  });

  test("shows every trademark sentence, and the Python and Redis symbols", async ({ page }) => {
    await page.goto("/work");
    for (const sentence of [
      "Names and logos are trademarks of their owners, appear here only to name the tools I use, and do not imply endorsement.",
      "Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.",
      "Python and the Python logos are trademarks or registered trademarks of the Python Software Foundation.",
      "Redis is a registered trademark of Redis Ltd. Any rights therein are reserved to Redis Ltd.",
    ])
      await expect(toolkit(page).getByText(sentence)).toBeVisible();
    await expect(chip(page, "Python")).toContainText("Python™");
    await expect(chip(page, "Redis")).toHaveText("®");
  });

  for (const width of [320, 360, 375]) {
    test(`has no sideways scroll at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/work");
      await toolkit(page).scrollIntoViewIfNeeded();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      const box = await page.locator(".toolkit-ticket").boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      // Every chip stays inside the ticket, however long its name.
      const outside = await page.locator(".toolkit-chip").evaluateAll((chips) => {
        const ticket = document.querySelector(".toolkit-ticket")!.getBoundingClientRect();
        return chips.filter((c) => c.getBoundingClientRect().right > ticket.right).length;
      });
      expect(outside).toBe(0);
    });
  }

  test("a chip lifts up and left onto a deeper shadow on hover", async ({ page }) => {
    await page.goto("/work");
    test.skip(!(await hoverable(page)), "touch devices cannot hover");
    await chip(page, "Playwright").scrollIntoViewIfNeeded();
    const rest = await chip(page, "Playwright").evaluate((el) => getComputedStyle(el).boxShadow);
    expect(await transformOf(page, "Playwright")).toBe("none");
    await chip(page, "Playwright").hover();
    await expect.poll(() => transformOf(page, "Playwright")).toBe("matrix(1, 0, 0, 1, -2, -2)");
    const lifted = await chip(page, "Playwright").evaluate((el) => getComputedStyle(el).boxShadow);
    expect(lifted).not.toBe(rest);
    expect(rest).toMatch(/3px 3px 0px 0px/);
    expect(lifted).toMatch(/5px 5px 0px 0px/);
  });

  test("a chip lifts the same way when something inside it takes focus", async ({ page }) => {
    await page.goto("/work");
    // The chips are not links yet. This proves the rule for the day one becomes a link.
    await chip(page, "GitLab").evaluate((el) => {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "focus target";
      el.append(link);
    });
    await chip(page, "GitLab").getByRole("link").focus();
    await expect.poll(() => transformOf(page, "GitLab")).toBe("matrix(1, 0, 0, 1, -2, -2)");
  });

  test("with reduced motion the shadow deepens and nothing moves", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ ...testInfo.project.use, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/work");
    test.skip(!(await hoverable(page)), "touch devices cannot hover");
    await chip(page, "Playwright").scrollIntoViewIfNeeded();
    await chip(page, "Playwright").hover();
    await expect
      .poll(() => chip(page, "Playwright").evaluate((el) => getComputedStyle(el).boxShadow))
      .toMatch(/5px 5px 0px 0px/);
    expect(await transformOf(page, "Playwright")).toBe("none");
    await context.close();
  });

  test("has no accessibility violations, at rest and with a chip hovered", async ({ page }) => {
    await page.goto("/work");
    await page.evaluate(() => document.fonts.ready);
    await toolkit(page).scrollIntoViewIfNeeded();
    let results = await new AxeBuilder({ page }).include("[data-toolkit]").withTags(tags).analyze();
    expect(results.violations).toEqual([]);
    if (await hoverable(page)) {
      await chip(page, "Playwright").hover();
      await page.waitForTimeout(400);
      results = await new AxeBuilder({ page }).include("[data-toolkit]").withTags(tags).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});

test.describe("work toolkit without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the same names, plates and notices", async ({ page }) => {
    await page.goto("/work");
    const section = toolkit(page);
    for (const name of allNames)
      await expect(
        section.getByText(name, { exact: true }).or(section.getByAltText(name, { exact: true })),
      ).toBeVisible();
    await expect(page.locator(".toolkit-plate")).toHaveCount(37);
    await expect(page.locator(".toolkit-notch")).toHaveCount(10);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});
