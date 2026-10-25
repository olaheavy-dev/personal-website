import { expect, test } from "@playwright/test";

// The navigation and the sitemap are built from the same flag registry, so they must always
// list the same pages. This runs against any site (the post deploy smoke too), so a drift
// between them shows up on the live URL, not only in tests that control the flags.
test("the pages in the navigation are exactly the pages in the sitemap", async ({ page, request }) => {
  await page.goto("/");

  // The desktop pill is hidden on phones; open the Menu there so its links are reachable.
  const menu = page.getByRole("button", { name: "Menu" });
  if (await menu.isVisible()) await menu.click();
  const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
  const inNav = (await links.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href"))))
    .filter((href): href is string => Boolean(href))
    .sort();

  const xml = await (await request.get("/sitemap.xml")).text();
  const inSitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]!).pathname)
    .filter((path) => path !== "/")
    .sort();

  expect(inNav).toEqual(inSitemap);
});
