import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricChip } from "../src/components/ticket/MetricChip";
import { Ticket } from "../src/components/ticket/Ticket";

// The ticket building blocks are not on any public page yet (they arrive with Work and
// Home selected stops), and a public test route would ship. So these tests render the real
// components to HTML here, then put that HTML into a loaded page of the site. The page's
// real stylesheet and the browser's real popover do the work; nothing is mocked.
// Behaviour that needs no browser (aria-expanded, URL hash) is in the Vitest tests.

const markup = renderToStaticMarkup(
  <main>
    <Ticket
      title="Optty"
      href="#ticket-link"
      eyebrow="Stop 02"
      chips={
        <MetricChip
          value="1M+"
          label="Google Play downloads"
          source={{
            label: "Google Play listing",
            url: "https://play.google.com/store/apps/details?id=example",
          }}
        />
      }
      stub={<a href="#inner-link">Release notes</a>}
    >
      <p className="mt-2 text-sm text-text-secondary">Payments.</p>
    </Ticket>
  </main>,
);

async function showTicket(page: Page) {
  await page.goto("/");
  await page.evaluate((html) => {
    document.body.innerHTML = html;
  }, markup);
}

test.describe("ticket", () => {
  test("keyboard: Tab reaches the link then the source button; Enter opens, Esc closes and returns focus", async ({
    page,
  }) => {
    await showTicket(page);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Optty" })).toBeFocused();
    await page.keyboard.press("Tab");
    const button = page.getByRole("button", { name: "Source for 1M+ Google Play downloads" });
    await expect(button).toBeFocused();

    await page.keyboard.press("Enter");
    const popover = page.locator("[popover]");
    await expect(popover).toBeVisible();
    await expect(popover.getByRole("link", { name: /Google Play listing/ })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("tap opens the source, as a bottom sheet on phones", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "needs a touch device");
    await showTicket(page);
    await page.getByRole("button", { name: /Source for/ }).tap();
    const popover = page.locator("[popover]");
    await expect(popover).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) < 768) {
      const box = await popover.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.y + box!.height).toBeCloseTo(viewport.height, 0);
      expect(box!.width).toBeCloseTo(viewport.width, 0);
    }
  });

  test("the stretched link covers the ticket, including the stub, but inner links stay clickable", async ({
    page,
  }) => {
    await showTicket(page);
    const ticket = page.locator(".ticket");
    const box = (await ticket.boundingBox())!;
    // A blank spot in the stub, far from its link.
    await page.mouse.click(box.x + box.width - 20, box.y + box.height - 8);
    expect(new URL(page.url()).hash).toBe("#ticket-link");
    await page.getByRole("link", { name: "Release notes" }).click();
    expect(new URL(page.url()).hash).toBe("#inner-link");
  });

  test("lifts on hover, except with reduced motion", async ({ page }) => {
    await showTicket(page);
    const ticket = page.locator(".ticket");
    await ticket.hover();
    await expect.poll(() => ticket.evaluate((el) => getComputedStyle(el).translate)).toBe("0px -4px");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.mouse.move(0, 0);
    await ticket.hover();
    await expect.poll(() => ticket.evaluate((el) => getComputedStyle(el).translate)).toBe("none");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no detectable accessibility violations in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await showTicket(page);
      await page.getByRole("button", { name: /Source for/ }).click();
      await expect(page.locator("[popover]")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
