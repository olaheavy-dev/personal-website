// Full-page screenshots of every route in light and dark at phone, tablet and
// desktop widths, for the visual review step in AGENTS.md ("When building").
// Run after `make build`:
//   node scripts/screenshots.mjs            all routes, against the standalone server
//   node scripts/screenshots.mjs / /work    only these routes
//   SHOTS_BASE_URL=https://staging.olaheavy.dev node scripts/screenshots.mjs
// Output: .artifacts/screenshots/<route>-<width>-<theme>.png
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { startFakeSupabase } from "../e2e/fixtures/fake-supabase.mjs";

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/work", "/lab", "/writing", "/travel", "/about", "/this-page-does-not-exist"];
const widths = [
  { name: "360", width: 360, height: 740 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const themes = ["light", "dark"];
const outDir = ".artifacts/screenshots";

const port = 3220;
const baseURL = process.env.SHOTS_BASE_URL ?? `http://127.0.0.1:${port}`;
let server;
let fake;

async function waitFor(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not start at ${url}`);
}

try {
  if (!process.env.SHOTS_BASE_URL) {
    // The build read its flags from the fake Supabase server, so serve with it up (make build).
    fake = await startFakeSupabase().catch(() => undefined); // already running: fine
    server = spawn("pnpm", ["serve"], {
      env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
      stdio: "ignore",
      detached: true,
    });
    await waitFor(`${baseURL}/healthz`);
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const theme of themes) {
    for (const size of widths) {
      const page = await browser.newPage({
        viewport: { width: size.width, height: size.height },
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      for (const route of routes) {
        await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
        const slug = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "_");
        await page.screenshot({ path: `${outDir}/${slug}-${size.name}-${theme}.png`, fullPage: true });
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(`screenshots: ${routes.length * widths.length * themes.length} in ${outDir}`);
} finally {
  if (server) process.kill(-server.pid);
  await fake?.close();
}
