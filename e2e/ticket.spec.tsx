import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricChip } from "../src/components/ticket/MetricChip";
import { Ticket } from "../src/components/ticket/Ticket";

// The ticket building blocks are not on any public page yet (they arrive with Work and
// Home selected stops), and a public test route would ship. So these tests render the real
// components to HTML here, then put that HTML into a loaded page of the site. The page's
// real stylesheet does the work; nothing is mocked.
// When Work and Home carry real tickets (and a MetricChip with a source), these checks move
// onto those pages and this file goes away.
// Behaviour that needs no browser (aria-expanded, URL hash) is in the Vitest tests.

const markup = renderToStaticMarkup(
  <main>
    <Ticket
      title="Optty"
      href="#ticket-link"
      eyebrow="2022 to 2024"
      chips={
        <MetricChip
          value="90+"
          label="BNPL and local payment methods"
          source={{
            kind: "link",
            label: "Optty announcement",
            url: "#source-link",
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
    value="90+"
    label="BNPL and local payment methods"
    source={{ kind: "link", label: "Optty announcement", url: "#source-link" }}
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
  test("keyboard: Tab reaches the ticket link, then the figure link, then the stub link", async ({
    page,
  }) => {
    await showTicket(page);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Optty", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    const figure = page.getByRole("link", { name: /source: Optty announcement/ });
    await expect(figure).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Release notes" })).toBeFocused();
  });

  test("the figure link is at least 44 px tall and names its source", async ({ page }) => {
    await showTicket(page);
    const figure = page.getByRole("link", { name: /source: Optty announcement, opens in a new tab/ });
    expect((await figure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(figure).toHaveAttribute("target", "_blank");
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
    // The figure link opens its source in a new tab and leaves this page where it was.
    const popup = page.waitForEvent("popup");
    await page.getByRole("link", { name: /source: Optty announcement/ }).click();
    expect((await popup).url()).toContain("#source-link");
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
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("a figure link in the stub of a linked ticket goes to its source, not to the stop", async ({
    page,
  }) => {
    await showTicket(page, stubChipMarkup);
    const popup = page.waitForEvent("popup");
    await page.getByRole("link", { name: /source: Optty announcement/ }).click();
    expect((await popup).url()).toContain("#source-link");
    expect(new URL(page.url()).hash).toBe("");
    await page.getByRole("link", { name: "Optty", exact: true }).click();
    expect(new URL(page.url()).hash).toBe("#ticket-link");
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
    const link = page.getByRole("link", { name: "Optty", exact: true });
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
    // The ring is part of the wrapper's filter, so it follows the notches.
    const filter = await page.locator(".ticket").evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain("drop-shadow");
    expect((filter.match(/drop-shadow/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect(await page.locator(".ticket").evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
  });
});
