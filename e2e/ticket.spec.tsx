import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricChip } from "../src/components/ticket/MetricChip";
import { Ticket } from "../src/components/ticket/Ticket";

// The ticket building blocks are not on any public page yet (they arrive with Work and
// Home selected stops), and a public test route would ship. So these tests render the real
// components to HTML here, then put that HTML into a loaded page of the site. The page's
// real stylesheet and the browser's real popover do the work; nothing is mocked.
// When Work and Home carry real tickets (and a MetricChip with a source), these checks move
// onto those pages and this file goes away.
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
            kind: "link",
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

async function showTicket(page: Page, html = markup) {
  await page.goto("/");
  await page.evaluate((markup) => {
    document.body.innerHTML = markup;
  }, html);
}

const chip = (
  <MetricChip
    value="1M+"
    label="Google Play downloads"
    source={{ kind: "link", label: "Google Play listing", url: "https://example.com/source" }}
  />
);

// A linked ticket whose MetricChip sits in the stub, where pointer-events are off.
const stubChipMarkup = renderToStaticMarkup(
  <main>
    <Ticket title="Optty" href="#ticket-link" stub={chip}>
      <p>Payments.</p>
    </Ticket>
  </main>,
);

// Long and short content in both layouts, to check the two pieces meet on the tear line.
const long = Array.from({ length: 40 }, () => "A long sentence about the work.").join(" ");
const geometryMarkup = renderToStaticMarkup(
  <main>
    {["short", "long"].map((length) =>
      (["stacked", "pass"] as const).map((layout) => (
        <div key={`${layout}-${length}`} data-case={`${layout}-${length}`} className="mb-8">
          <Ticket as="div" layout={layout} title="Title" stub={<p>{length === "long" ? long : "Stub"}</p>}>
            <p>{length === "long" ? long : "Body"}</p>
          </Ticket>
        </div>
      )),
    )}
  </main>,
);

async function seam(page: Page, name: string) {
  return page.locator(`[data-case="${name}"]`).evaluate((el) => {
    const body = el.querySelector(".ticket-body")!.getBoundingClientRect();
    const stub = el.querySelector(".ticket-stub")!.getBoundingClientRect();
    return {
      stubTopMinusBodyBottom: stub.top - body.bottom,
      stubLeftMinusBodyRight: stub.left - body.right,
      heightDiff: stub.height - body.height,
      stubIsBelow: stub.top >= body.bottom - 1.01 && stub.left < body.right,
    };
  });
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

  test("a source popover in the stub of a linked ticket stays open when its text is clicked", async ({
    page,
  }) => {
    await showTicket(page, stubChipMarkup);
    await page.getByRole("button", { name: /Source for/ }).click();
    const popover = page.locator("[popover]");
    await expect(popover).toBeVisible();
    await popover.getByText("1M+ Google Play downloads").click();
    await expect(popover).toBeVisible();
    expect(new URL(page.url()).hash).toBe("");
  });

  test.describe("the body and stub meet on the tear line", () => {
    for (const length of ["short", "long"]) {
      test(`stacked, ${length} content`, async ({ page }) => {
        await showTicket(page, geometryMarkup);
        const gap = await seam(page, `stacked-${length}`);
        expect(gap.stubTopMinusBodyBottom).toBeCloseTo(-1, 1);
      });

      test(`pass at md and up, ${length} content`, async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 900 });
        await showTicket(page, geometryMarkup);
        const gap = await seam(page, `pass-${length}`);
        expect(gap.stubLeftMinusBodyRight).toBeCloseTo(-1, 1);
        expect(gap.heightDiff).toBeCloseTo(0, 1);
      });

      test(`pass below md stacks like the stacked layout, ${length} content`, async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 900 });
        await showTicket(page, geometryMarkup);
        const gap = await seam(page, `pass-${length}`);
        expect(gap.stubTopMinusBodyBottom).toBeCloseTo(-1, 1);
      });
    }
  });

  test("a focused linked ticket shows one ring, not two", async ({ page }) => {
    await showTicket(page);
    await page.keyboard.press("Tab");
    const link = page.getByRole("link", { name: "Optty" });
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
    // The ring is part of the wrapper's filter, so it follows the notches.
    const filter = await page.locator(".ticket").evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain("drop-shadow");
    expect((filter.match(/drop-shadow/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect(await page.locator(".ticket").evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
  });
});
