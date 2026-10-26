import { expect, test } from "@playwright/test";

// Issue #88, the cold start case. `make e2e-cold` builds with every flagged page Off
// (FAKE_FLAGS_OFF in e2e/fixtures/fake-supabase.mjs) and runs this file against a fresh server,
// before any revalidation. The status then comes straight from what the build wrote.
//
// What this proves: a page that is Off when `next build` prerenders it is built as a static 404
// with a real status and noindex. What it cannot prove: a restart after a revalidation.
// `pnpm serve` copies .next/server/app into the standalone folder, and the running server
// writes rebuilt pages there, so a second run over the same build is not cold. That is why the
// make target removes .next first and last.
const wrongTurn = "Wrong turn | Sunkanmi Olawuwo";

test.skip(Boolean(process.env.E2E_BASE_URL), "the cold start journey needs its own Off build");

for (const path of ["/work", "/lab", "/writing", "/travel", "/about"]) {
  test(`@cold ${path} is Off at build time: a real 404 with noindex and the Wrong turn page`, async ({
    page,
    request,
  }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).toMatch(/<meta name="robots" content="[^"]*noindex/);
    const shown = await page.goto(path);
    expect(shown?.status()).toBe(404);
    await expect(page).toHaveTitle(wrongTurn);
    await expect(page.getByRole("heading", { level: 1, name: "Looks like a wrong turn" })).toBeVisible();
  });
}

test("@cold the flags that are still On at build time are untouched", async ({ request }) => {
  expect((await request.get("/")).status()).toBe(200);
});
