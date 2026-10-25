import { expect, test, type APIResponse } from "@playwright/test";
import { buildCsp } from "../src/lib/security/headers";

// Security headers and the Content Security Policy (issue #53, decision 0017). Numbers in
// test names are the plan's acceptance criteria.
//
// The whole file runs unchanged against staging: the post-deploy smoke runs `make e2e`
// with E2E_BASE_URL set, which includes this file. Header checks do not depend on the
// browser project, so they run once (desktop-light).

const routes = ["/", "/work", "/lab", "/writing", "/travel", "/about"];

type Kind = "page" | "api";

function headerCounts(response: APIResponse) {
  const counts = new Map<string, number>();
  for (const { name } of response.headersArray()) {
    counts.set(name.toLowerCase(), (counts.get(name.toLowerCase()) ?? 0) + 1);
  }
  return counts;
}

async function expectSecure(response: APIResponse, kind: Kind) {
  const counts = headerCounts(response);
  // No header name appears twice: not from the app, not from a proxy in front of it.
  // Next's own x-nextjs-prerender marker is sent twice by the framework, not by us.
  for (const [name, count] of counts) {
    if (name === "x-nextjs-prerender") continue;
    expect(`${name} x${count}`).toBe(`${name} x1`);
  }

  const headers = response.headers();
  expect(headers["content-security-policy"]).toBe(buildCsp(kind));
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toBe("max-age=31536000");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  // criterion 12
  expect(headers["x-powered-by"]).toBeUndefined();
}

test.describe("security headers @headers", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop-light", "headers do not vary by project");
  });

  for (const path of routes) {
    test(`criterion 3: ${path} carries the page policy and base headers once`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      await expectSecure(response, "page");
    });
  }

  test("criterion 3: the lab route, whether served or a 404, carries the page policy", async ({
    request,
  }) => {
    await expectSecure(await request.get("/_lab/route"), "page");
  });

  test("criterion 3: a 404 carries the page policy", async ({ request }) => {
    const response = await request.get("/no-such-page");
    expect(response.status()).toBe(404);
    await expectSecure(response, "page");
  });

  test("criterion 3: /admin carries one policy (the page policy until the admin shell wires its nonce)", async ({
    request,
  }) => {
    await expectSecure(await request.get("/admin"), "page");
  });

  test("criterion 3: /healthz carries the api policy and is not cached", async ({ request }) => {
    const response = await request.get("/healthz");
    expect(response.status()).toBe(200);
    await expectSecure(response, "api");
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["cross-origin-resource-policy"]).toBe("same-origin");
  });

  test("criterion 3: /api/ask carries the api policy, is not cached and allows no CORS", async ({
    request,
  }) => {
    const response = await request.get("/api/ask");
    await expectSecure(response, "api");
    // Today /api/ask is a 404, which Next marks no-store itself; the real route gets ours.
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  });

  test("criterion 3: a static asset carries the base headers once", async ({ request }) => {
    const home = await (await request.get("/")).text();
    const asset = /\/_next\/static\/[^"'\s]+\.css/.exec(home)?.[0];
    expect(asset).toBeTruthy();
    const response = await request.get(asset!);
    expect(response.status()).toBe(200);
    await expectSecure(response, "page");
  });
});

test.describe("security policy in the browser", () => {
  async function watchViolations(page: import("@playwright/test").Page) {
    const consoleMessages: string[] = [];
    page.on("console", (message) => {
      if (/content security policy|refused to (load|execute|apply)/i.test(message.text())) {
        consoleMessages.push(message.text());
      }
    });
    await page.addInitScript(() => {
      const w = window as unknown as { __csp: string[] };
      w.__csp = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        w.__csp.push(`${event.violatedDirective} blocked ${event.blockedURI || "inline"}`);
      });
    });
    return async () => {
      const seen = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
      return [...seen, ...consoleMessages];
    };
  }

  for (const path of [...routes, "/no-such-page"]) {
    test(`criterion 4: ${path} loads with no policy violation`, async ({ page }) => {
      const violations = await watchViolations(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await violations()).toEqual([]);
    });
  }

  test("criterion 4: theme toggle, menu, copy email and a client navigation raise no violation", async ({
    page,
    context,
    baseURL,
  }) => {
    await context
      .grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL!).origin })
      .catch(() => {});
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Toggle colour theme" }).click();

    const menu = page.getByRole("button", { name: "Menu" });
    const nav = page.getByRole("navigation", { name: "Main" });
    if (await menu.isVisible()) {
      await menu.click();
      await expect(nav.getByRole("link", { name: "Writing" })).toBeVisible();
      await page.keyboard.press("Escape");
      await menu.click();
    }

    const copy = page.getByRole("button", { name: /Copy email/ });
    await copy.scrollIntoViewIfNeeded();
    await copy.click();

    if (!(await nav.getByRole("link", { name: "Writing" }).isVisible())) await menu.click();
    await nav.getByRole("link", { name: "Writing" }).click();
    await expect(page).toHaveURL(/\/writing$/);
    await page.waitForLoadState("networkidle");

    expect(await violations()).toEqual([]);
  });

  test("criterion 4b: the watcher does see a violation (an image from another origin is blocked)", async ({
    page,
  }) => {
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.evaluate(() => {
      const img = document.createElement("img");
      img.src = "https://example.com/not-allowed.png";
      document.body.append(img);
    });
    await expect.poll(async () => (await violations()).length).toBeGreaterThan(0);
    expect((await violations()).join(" ")).toContain("img-src");
  });

  test("criterion 5: the head script runs before the page is parsed (saved dark theme, data-js)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {
        /* storage blocked */
      }
      document.addEventListener("DOMContentLoaded", () => {
        const html = document.documentElement;
        (window as unknown as { __early: string }).__early =
          `${html.getAttribute("data-theme")}|${html.hasAttribute("data-js")}`;
      });
    });
    await page.goto("/");
    expect(await page.evaluate(() => (window as unknown as { __early: string }).__early)).toBe("dark|true");
  });

  test("criterion 7: the UK time fills in even when no script chunk loads", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("time[data-visual-mask]")).toHaveText(/^\d{2}:\d{2}$/);
  });
});

test.describe("security policy without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("criterion 10: the home page still renders its content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sunkanmi");
    await expect(page.getByRole("link", { name: /Email me/ }).first()).toBeAttached();
  });
});
