import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { defaultFlags, fakeUrl } from "./fixtures/fake-constants.mjs";
import {
  allPages,
  applyFlags,
  control,
  expectStatus,
  flagsWithout,
  resetFlags,
  revalidate,
  revalidateSecret,
  revalidateStops,
} from "./fixtures/flags";

// Feature flags end to end (issue #6). These change the answer of the fake Supabase server and
// ask the site to revalidate, so they share state: `make e2e-flags` runs them one at a time,
// and `make e2e` leaves them out. They cannot run against a live site (no fake to control).
const remote = Boolean(process.env.E2E_BASE_URL);
const wrongTurn = "Wrong turn | Sunkanmi Olawuwo";
const axeTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.describe.configure({ mode: "serial" });
test.skip(remote, "the flag journeys need the fake Supabase server");

test.afterAll(async ({ request }) => {
  await resetFlags(request, "203.0.113.99");
});

async function navLabels(page: Page) {
  const nav = page.getByRole("navigation", { name: "Main" });
  return nav.getByRole("link").allTextContents();
}

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function sitemapPaths(request: Parameters<typeof revalidate>[0]) {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>https:\/\/olaheavy\.dev([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
}

test("@flags the fake serves today's flags, so every page is on", async ({ page, request }) => {
  await resetFlags(request);
  for (const path of ["/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/lab", "/writing", "/travel", "/about"]);
  await page.goto("/");
  if (!(await page.getByRole("button", { name: "Menu" }).isVisible())) {
    expect(await navLabels(page)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
  }
});

test("@flags Off gives the Wrong turn 404 after one revalidation, and the page disappears everywhere", async ({
  page,
  request,
}, testInfo) => {
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.2");

  // The very next GET is the 404: a real status, the Wrong turn title and noindex.
  const response = await page.goto("/lab");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(wrongTurn);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  const html = await (await request.get("/lab")).text();
  expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
  // The hidden page's own title never leaks into the 404.
  expect(html).not.toContain("Lab | Sunkanmi");

  // Hidden in the navigation: the desktop pill, and the mobile menu.
  await page.goto("/");
  if (testInfo.project.name === "small-phone") {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  expect(await navLabels(page)).toEqual(["Work", "Writing", "Travel", "About"]);
  // No link to it is left anywhere in the page.
  await expect(page.locator('a[href="/lab"]')).toHaveCount(0);
  const home = await (await request.get("/")).text();
  expect(home).not.toContain('href="/lab"');

  // Hidden in the sitemap.
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/writing", "/travel", "/about"]);
  // The other pages are untouched.
  expect((await request.get("/work")).status()).toBe(200);
});

test("@flags a hidden page answers like a mistyped URL: same status and robots header, nothing of its own", async ({
  request,
}) => {
  // Not byte for byte: a hidden page is Next's static error shell (no lang, drawn in the
  // browser), an unknown address is the prerendered 404. What must match is what a crawler or
  // a visitor can tell: the status, the robots header, and no title or text from the page.
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.3");
  const hidden = await request.get("/lab");
  const mistyped = await request.get("/this-page-does-not-exist");
  expect(hidden.status()).toBe(mistyped.status());
  expect(hidden.headers()["x-robots-tag"]).toBe(mistyped.headers()["x-robots-tag"]);
  const html = await hidden.text();
  expect(html).not.toContain("Things I build to learn");
  expect(html).not.toContain("Lab | Sunkanmi");
  expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
});

test("@flags after a revalidation the 404 never holds a visitor's address", async ({ request }) => {
  // The 404 reads the flags, so it is rebuilt after each revalidation. Without the proxy's one
  // fixed path it would be rebuilt for whichever address came first and then served to all.
  // So each kind of address goes first right after its own revalidation, then a clean address
  // follows, and neither response may hold any requested path.
  const first = [
    "/first-missing-aaa",
    "/missing/person@example.com",
    "/missing-dotted.html",
    "/api/nope-api",
    "/_next/nope-next",
    "/logos/nope-logo.svg",
  ];
  for (const path of first) {
    await applyFlags(request, flagsWithout("page.lab"), "203.0.113.14");
    const one = await request.get(path);
    const two = await request.get("/follow-up-missing-zzz/deeper");
    for (const response of [one, two]) {
      expect(response.status(), path).toBe(404);
      const body = await response.text();
      for (const word of [
        "first-missing",
        "person@example",
        "missing-dotted",
        "nope-api",
        "nope-next",
        "nope-logo",
        "follow-up-missing",
      ]) {
        expect(body, `${path} leaked ${word}`).not.toContain(word);
      }
    }
  }
  // An unknown API address keeps the API policy, not the page policy.
  const api = await request.get("/api/nope-api");
  expect(api.headers()["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'");
});

test("@flags a switched on page comes back after one revalidation", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.travel"), "203.0.113.4");
  expect((await request.get("/travel")).status()).toBe(404);
  await applyFlags(request, defaultFlags, "203.0.113.4");
  const response = await page.goto("/travel");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/^Travel \|/);
});

test("@flags Preview is treated as Off until Auth: no page, no link, no sitemap entry", async ({
  request,
}) => {
  // The public role never receives a Preview row (row level security), so the fake leaves it
  // out as Supabase does; the visibility rule also hides it from the public viewer.
  await control(request, { flags: { ...flagsWithout("page.about"), "page.about": "preview" }, status: null });
  expect((await revalidate(request, "203.0.113.5")).status()).toBe(200);
  await expectStatus(request, "/about", 404);
  expect(await sitemapPaths(request)).not.toContain("/about");
});

test("@flags the 404's way back drops Work when Work is hidden", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.work"), "203.0.113.6");
  await page.goto("/this-page-does-not-exist");
  const way = page.getByRole("list", { name: "The way back" });
  await expect(way.getByRole("link")).toHaveCount(1);
  await expect(way.getByRole("link", { name: /Home/ })).toBeVisible();
  await expect(way.getByRole("link", { name: /Work/ })).toHaveCount(0);
  // A hidden page shows the same way back.
  await page.goto("/work");
  await expect(page.getByRole("list", { name: "The way back" }).getByRole("link")).toHaveCount(1);
});

test("@flags with every page off the header is still usable: no empty nav, no Menu button", async ({
  page,
  request,
}) => {
  await applyFlags(request, flagsWithout(...allPages), "203.0.113.7");
  for (const width of [1440, 375, 360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.locator("header nav")).toHaveCount(0);
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /Sunkanmi/ }).first()).toBeVisible();
    await expect(header.getByRole("button", { name: /theme/i })).toBeVisible();
    await expect(header.getByRole("link", { name: "Email me" }).filter({ visible: true })).toHaveCount(1);
    expect(await overflow(page), `${width}px`).toBeLessThanOrEqual(0);
  }
  expect(await sitemapPaths(request)).toEqual(["/"]);
  for (const path of ["/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("list", { name: "The way back" }).getByRole("link")).toHaveCount(1);
});

test("@flags with items off there is no sideways scroll at 375, 360 and 320", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.work", "page.lab"), "203.0.113.8");
  for (const width of [375, 360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/writing", "/this-page-does-not-exist"]) {
      await page.goto(path);
      expect(await overflow(page), `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("@flags keyboard order skips hidden items, and the pill indicator sits under the current one", async ({
  page,
  request,
}, testInfo) => {
  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.9");
  await page.goto("/writing");

  if (testInfo.project.name === "small-phone") {
    // Phone: the brand, then the Menu button; its panel lists the visible items in order.
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /Sunkanmi/ }).first()).toBeFocused();
    await page.getByRole("button", { name: "Menu" }).click();
    expect(await navLabels(page)).toEqual(["Work", "Writing", "Travel", "About"]);
    return;
  }

  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // brand
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Work", "Writing", "Travel", "About"]) {
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: label })).toBeFocused();
  }
  // The lilac indicator sits under Writing, the current page.
  const indicator = nav.locator("li[aria-hidden=true]");
  await expect(async () => {
    const marker = await indicator.boundingBox();
    const link = await nav.getByRole("link", { name: "Writing" }).boundingBox();
    expect(marker).not.toBeNull();
    expect(Math.abs(marker!.x - link!.x)).toBeLessThan(8);
    expect(Math.abs(marker!.width - link!.width)).toBeLessThan(8);
  }).toPass();
});

test("@flags the header and the 404 pass axe in light and dark with items off", async ({ page, request }) => {
  await applyFlags(request, flagsWithout("page.lab", "page.travel"), "203.0.113.10");
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const path of ["/", "/lab", "/this-page-does-not-exist"]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
      expect(results.violations, `${path} ${colorScheme}`).toEqual([]);
    }
  }
});

test.describe("javascript off", () => {
  test.use({ javaScriptEnabled: false });

  test("@flags the server HTML already leaves the hidden item out, and a hidden URL is still a 404", async ({
    page,
    request,
  }) => {
    await applyFlags(request, flagsWithout("page.lab"), "203.0.113.11");
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).not.toContain('href="/lab"');
    expect(html).toContain('href="/work"');
    expect((await request.get("/lab")).status()).toBe(404);
  });
});

test("@flags a failed read during a revalidation keeps the last good pages, with status 200", async ({
  page,
  request,
}) => {
  // A good read first (resetFlags visits every page), so this process holds a last good set.
  await resetFlags(request, "203.0.113.12");
  await control(request, { status: 500, flags: flagsWithout("page.work") });
  const response = await revalidate(request, "203.0.113.12");
  expect(response.status()).toBe(200);

  for (const path of ["/", "/work", "/lab", "/writing", "/travel", "/about"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect(await sitemapPaths(request)).toEqual(["/", "/work", "/lab", "/writing", "/travel", "/about"]);
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The read is retried within a minute: once Supabase is back the site follows it.
  await control(request, { status: null });
  const again = await revalidate(request, "203.0.113.12");
  expect(again.status()).toBe(200);
  await expectStatus(request, "/work", 404);
});

test("@flags /api/revalidate refuses the wrong caller", async ({ request }) => {
  const address = "203.0.113.13";
  const base = { "x-forwarded-for": address };
  const body = { type: "UPDATE", table: "feature_flags" };
  expect((await request.post("/api/revalidate", { headers: base, data: body })).status()).toBe(401);
  expect(
    (
      await request.post("/api/revalidate", {
        headers: { ...base, authorization: "Bearer not-the-secret" },
        data: body,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/revalidate", {
        headers: { ...base, authorization: `Bearer ${revalidateSecret}` },
        data: { table: "settings" },
      })
    ).status(),
  ).toBe(400);
  expect((await request.get("/api/revalidate", { headers: base })).status()).toBe(405);
  expect((await request.put("/api/revalidate", { headers: base, data: body })).status()).toBe(405);
});

test("@flags /api/revalidate allows 30 wrong attempts a minute from one address, then 429, and never limits the right secret", async ({
  request,
}, testInfo) => {
  // One address per project, repeat and retry, because the window is a minute and the projects,
  // and a retry of this test, run back to back inside it.
  const own = addressFor(testInfo, 0);
  const wrong = () =>
    request.post("/api/revalidate", {
      headers: { authorization: "Bearer not-the-secret", "x-forwarded-for": own },
      data: { tag: "flags" },
    });
  const statuses: number[] = [];
  for (let i = 0; i < 32; i++) statuses.push((await wrong()).status());
  expect(statuses.slice(0, 30).every((status) => status === 401)).toBe(true);
  expect(statuses.slice(30)).toEqual([429, 429]);
  // The right secret from the same address still works, and another address is unaffected.
  expect((await revalidate(request, own)).status()).toBe(200);
  expect((await revalidate(request, "203.0.113.201")).status()).toBe(200);
});

// A distinct address per project, repeat and retry, so /api/revalidate's one minute window of
// wrong attempts never carries over. The index, not the name length: "mobile" and "tablet" are
// both six letters.
function addressFor(testInfo: TestInfo, base: number) {
  const project = testInfo.config.projects.findIndex((candidate) => candidate.name === testInfo.project.name);
  return `10.${testInfo.repeatEachIndex}.${testInfo.retry}.${base + project}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pagePaths = ["/work", "/lab", "/writing", "/travel", "/about"] as const;
const pageKeys: Record<(typeof pagePaths)[number], string> = {
  "/work": "page.work",
  "/lab": "page.lab",
  "/writing": "page.writing",
  "/travel": "page.travel",
  "/about": "page.about",
};

// Issue #88. A page that is Off or Preview must answer a real 404 status, not a 200 that only
// looks like a 404. Next.js fixes the status when the response starts streaming, so the gate
// has to be decided while the page is prerendered (see docs/flags.md, "The rule: nothing request
// bound before the gate"). Each check reads the status of a plain GET, the robots header or tag, and
// the Wrong turn page a visitor sees.
// After /api/revalidate the NEXT request is the first one rebuilt from the new flags, except
// for a page whose render began before the revalidation and was still running when it arrived
// (the previous test's browser prefetches the other pages, and the server keeps rendering after
// the browser has gone). Next.js stamps that page with the time it finished, so it counts as
// newer than the revalidation and keeps answering the old status until the tag is revalidated
// again. The route therefore revalidates a second time 5 s later (src/app/api/revalidate/
// route.ts), and the "straddled" journey below proves it with a deliberately slow flag read.
// So a journey waits for the new status by condition, never by a fixed sleep: up to 15 s, which
// is the 5 s pause plus a render on a slow runner, then requires the status to hold for the
// requests that follow. See docs/flags.md. CI failures before this: runs 40361033845 (/lab),
// 40388116289 (/about) and 40410151428 (/writing), each stuck on 200 for the whole 5 s window.
async function expectStatusToSettle(
  request: Parameters<typeof revalidate>[0],
  path: string,
  expected: number,
) {
  await expectStatus(request, path, expected);
  for (let i = 0; i < 3; i++) {
    expect((await request.get(path)).status(), `${path} stays ${expected}`).toBe(expected);
  }
}

async function expectRealWrongTurn(
  request: Parameters<typeof revalidate>[0],
  page: Page,
  path: (typeof pagePaths)[number],
) {
  await expectStatusToSettle(request, path, 404);
  const response = await request.get(path);
  expect(response.status(), `${path} status`).toBe(404);
  const html = await response.text();
  expect(html, `${path} noindex`).toMatch(/<meta name="robots" content="[^"]*noindex/);
  const shown = await page.goto(path);
  expect(shown?.status(), `${path} status in the browser`).toBe(404);
  await expect(page, path).toHaveTitle(wrongTurn);
  await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
}

for (const path of pagePaths) {
  test(`@flags ${path}: Off answers a real 404, Preview the same, and On comes back as 200`, async ({
    page,
    request,
  }) => {
    const key = pageKeys[path];
    const address = `203.0.113.${40 + pagePaths.indexOf(path)}`;

    await applyFlags(request, flagsWithout(key), address);
    await expectRealWrongTurn(request, page, path);

    // Preview: the public role never receives the row, so it is the same as Off for everyone
    // (decision 0018) until the owner can sign in (#23).
    await control(request, { flags: { ...flagsWithout(key), [key]: "preview" }, status: null });
    expect((await revalidate(request, address)).status()).toBe(200);
    await expectRealWrongTurn(request, page, path);

    await applyFlags(request, defaultFlags, address);
    await expectStatusToSettle(request, path, 200);
    const back = await page.goto(path);
    expect(back?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Looks like a wrong turn");
  });
}

test("@flags in a quiet state the very next request after a flip is already right", async ({
  request,
}, testInfo) => {
  // The guard for the FIRST expiry. The other journeys poll, so a broken first revalidateTag
  // would still pass them after the 5 s second pass. Here nothing can straddle: resetFlags has
  // just rebuilt every page one request at a time and awaited each, no browser is open (so no
  // prefetching), and the only requests are the ones below. So the next request must already be
  // right, and well inside the 5 s of the second pass.
  const address = addressFor(testInfo, 80);
  await resetFlags(request, address);
  await control(request, { flags: flagsWithout("page.lab"), status: null });
  const flippedAt = Date.now();
  expect((await revalidate(request, address)).status()).toBe(200);
  expect((await request.get("/lab")).status()).toBe(404);
  expect(Date.now() - flippedAt).toBeLessThan(2000);
  await applyFlags(request, defaultFlags, address);
});

test("@flags a page whose render straddled the change is corrected within seconds, not kept as fresh", async ({
  request,
}, testInfo) => {
  // The failure behind the CI runs listed above, made on purpose: /lab starts rebuilding while
  // Lab is On, the flag goes Off and the webhook arrives, then the slow rebuild finishes. Without
  // the second revalidation in the route, that page stays 200 until the next revalidation.
  const address = addressFor(testInfo, 60);
  await resetFlags(request, address);
  try {
    await control(request, { delay: 1500 });
    expect((await revalidate(request, address)).status()).toBe(200);
    const slow = request.get("/lab"); // reads the flags now (Lab On), but the reply is held back
    await sleep(300);
    await control(request, { flags: flagsWithout("page.lab"), delay: 0 });
    expect((await revalidate(request, address)).status()).toBe(200);
    expect((await slow).status()).toBe(200); // the straddling render, answered with the old flags
    const changedAt = Date.now();
    await expectStatusToSettle(request, "/lab", 404);
    // The second pass comes 5 s after the change, so the fix shows within about that, not later.
    expect(Date.now() - changedAt, "corrected within the second pass").toBeLessThan(8000);
    expect(await sitemapPaths(request)).not.toContain("/lab");
  } finally {
    await control(request, { reset: true });
  }
});

test("@flags the site reads its flags from the fake, never from .env.local", async ({ request }) => {
  // A build or server that fell back to the hosted project (.env.local) would ignore the fake
  // and every journey above would fail in a confusing way. `make build` sets the fake's address
  // explicitly, which wins over .env.local (node_modules/next/dist/docs/01-app/02-guides/
  // environment-variables.md, "Environment Variable Load Order": process.env is looked up first,
  // then the .env files), and Playwright passes its own environment on
  // to the server it starts (playwright 1.64.1, lib/runner/index.js, webServer env is
  // { ...DEFAULT_ENVIRONMENT_VARIABLES, ...process.env }). This proves the running site really
  // uses the fake.
  const before = (await control(request, { reset: true })).reads;
  expect((await revalidate(request, "203.0.113.60")).status()).toBe(200);
  expect((await request.get("/")).status()).toBe(200);
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  const after = (await (await request.get(`${fakeUrl}/__control`)).json()).reads as number;
  expect(after, "the site did not read the flags from the fake Supabase server").toBeGreaterThan(before);
});

test("@flags the fake leaves the site as it found it", async ({ request }) => {
  await resetFlags(request, "203.0.113.202");
  const state = await (await request.get(`${fakeUrl}/__control`)).json();
  expect(state.flags).toEqual(defaultFlags);
});

test("@flags the fake content server answers empty or with an error on request, and is reset afterwards", async ({
  request,
}) => {
  const post = (data: object) => request.post(`${fakeUrl}/__control`, { data });
  try {
    expect((await (await request.get(`${fakeUrl}/rest/v1/stops`)).json()).length).toBe(7);
    await post({ content: "empty" });
    expect(await (await request.get(`${fakeUrl}/rest/v1/stops`)).json()).toEqual([]);
    await post({ content: "error" });
    expect((await request.get(`${fakeUrl}/rest/v1/lab_projects`)).status()).toBe(500);
  } finally {
    await post({ reset: true });
  }
  expect((await request.get(`${fakeUrl}/rest/v1/lab_projects`)).status()).toBe(200);
});

test("@flags the Lab strip on Home follows page.lab: Off removes the whole section with no gap, On brings it back", async ({
  page,
  request,
}) => {
  const gaps = () =>
    page.evaluate(() => {
      const boxes = ["#selected-stops", "#lab-writing", "footer"]
        .map((selector) => document.querySelector(selector))
        .filter((el): el is Element => el !== null)
        .map((el) => el.getBoundingClientRect());
      return boxes.slice(1).map((box, index) => Math.round(box.top - boxes[index]!.bottom));
    });

  await applyFlags(request, flagsWithout("page.lab"), "203.0.113.31");
  await page.goto("/");
  await expect(page.locator("#lab-strip")).toHaveCount(0);
  // Writing is on but has no posts yet, so with Lab off there is no two-up at all.
  await expect(page.locator("#lab-writing")).toHaveCount(0);
  await expect(page.locator("#latest-writing")).toHaveCount(0);
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("In the lab");
  expect(html).not.toContain("foresight.olaheavy.dev");
  // Nothing is left between Selected work and the footer but the one section gap.
  const [closed] = await gaps();
  await applyFlags(request, defaultFlags, "203.0.113.31");
  await page.goto("/");
  await expect(page.locator("#lab-strip")).toBeVisible();
  const [selectedToLab, labToFooter] = await gaps();
  expect(Math.abs(selectedToLab! - closed!)).toBeLessThanOrEqual(1);
  expect(Math.abs(labToFooter! - closed!)).toBeLessThanOrEqual(1);
});

test("@flags Writing on without posts leaves the Lab strip spanning, and Lab with Writing off still shows", async ({
  page,
  request,
}) => {
  await applyFlags(request, defaultFlags, "203.0.113.32");
  await page.goto("/");
  await expect(page.locator("#latest-writing")).toHaveCount(0);
  await expect(page.locator("#lab-strip")).toBeVisible();
  const spans = await page.evaluate(() => {
    const row = document.querySelector("#lab-writing")!;
    const style = getComputedStyle(row);
    const room = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return Math.abs(room - document.querySelector("#lab-strip")!.getBoundingClientRect().width);
  });
  expect(spans).toBeLessThanOrEqual(1);

  await applyFlags(request, flagsWithout("page.writing"), "203.0.113.32");
  await page.goto("/");
  await expect(page.locator("#lab-strip")).toBeVisible();
  await expect(page.locator('a[href="/writing"]')).toHaveCount(0);
});

test("@flags with Work Off, Home's tickets are not linked and /work is the Wrong turn 404", async ({
  page,
  request,
}) => {
  await applyFlags(request, flagsWithout("page.work"), "203.0.113.34");
  await expectStatus(request, "/work", 404);
  await page.goto("/");
  await expect(page.locator('a[href^="/work"]')).toHaveCount(0);
  await applyFlags(request, defaultFlags, "203.0.113.34");
  await page.goto("/");
  await expect(page.locator('#selected-stops h3 a[href^="/work#"]')).toHaveCount(3);
});

test("@flags /work with the stops unreadable or empty shows the header and the calm sentence, with status 200", async ({
  page,
  request,
}) => {
  await resetFlags(request, "203.0.113.35");
  try {
    for (const mode of ["error", "empty"] as const) {
      await control(request, { content: mode });
      expect((await revalidateStops(request, "203.0.113.35")).status()).toBe(200);
      await expect
        .poll(async () => (await (await request.get("/work")).text()).includes("isn&#x27;t loading"), {
          message: `/work should show the failure sentence (${mode})`,
          timeout: 15_000,
        })
        .toBe(true);
      const response = await page.goto("/work");
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: "Work" })).toBeVisible();
      await expect(
        page.getByText("The work list isn't loading right now. The highlights are on the home page."),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "the home page" })).toHaveAttribute("href", "/");
      await expect(page.getByRole("region", { name: /Work, newest first/ })).toHaveCount(0);
      await expect(page.locator("[data-work-entry]")).toHaveCount(0);
    }
  } finally {
    await control(request, { reset: true });
    await revalidateStops(request, "203.0.113.35");
    await expect
      .poll(async () => (await (await request.get("/work")).text()).includes("data-work-entry"), {
        timeout: 15_000,
      })
      .toBe(true);
  }
});
