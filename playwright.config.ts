import { defineConfig, devices } from "@playwright/test";
import { fakeUrl } from "./e2e/fixtures/fake-constants.mjs";

// End-to-end and accessibility checks run against the standalone server from
// `next build` (`pnpm serve`), the same artefact the Docker image ships.
const port = Number(process.env.E2E_PORT ?? 3210);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  // Screenshot baselines (visual.spec.ts). {platform} keeps Linux images, made in the
  // CI container, apart from local macOS ones, which are git-ignored.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-light", use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "desktop-dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    // Smallest common phone width; the brief's floor is 375 px, so 360 leaves margin.
    {
      name: "small-phone",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
    // Tablet portrait: the md breakpoint, where the pill nav replaces the Menu button.
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: false,
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          // The stand in for Supabase that the build read its flags from (make build starts
          // the same server). Tests change its answer through /__control (e2e/flags.spec.ts).
          command: "node e2e/fixtures/fake-supabase.mjs",
          url: `${fakeUrl}/__control`,
          reuseExistingServer: !process.env.CI,
          timeout: 15_000,
        },
        {
          command: "pnpm serve",
          // LAB_PAGES switches on the developer demo pages (/_lab/...); never set outside tests.
          // REVALIDATE_SECRET is a throwaway value that only these tests know.
          env: {
            PORT: String(port),
            HOSTNAME: "127.0.0.1",
            LAB_PAGES: "1",
            REVALIDATE_SECRET: "e2e-revalidate-secret",
          },
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
