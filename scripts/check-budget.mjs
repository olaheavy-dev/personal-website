// Fails the build when a prerendered page's initial transfer (gzipped HTML +
// every /_next/static asset it references: JS, CSS, preloaded fonts) exceeds
// its budget. Budgets come from the design brief's quality bar.
// Run after `next build`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const KB = 1024;
const budgets = [{ route: "/", file: ".next/server/app/index.html", maxBytes: 600 * KB }];

// Public pages must stay prerendered: the static security policy (decision 0017) and
// edge caching both depend on it. A page that is removed, renamed or loses its static shell has no .html file here.
const prerendered = ["/", "/work", "/lab", "/writing", "/travel", "/about"];

const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
let failed = false;

for (const route of prerendered) {
  const file = `.next/server/app/${route === "/" ? "index" : route.slice(1)}.html`;
  if (!existsSync(file)) {
    console.error(`budget FAIL ${route}: ${file} is missing, so the page is no longer prerendered.`);
    failed = true;
  }
}

for (const { route, file, maxBytes } of budgets) {
  if (!existsSync(file)) {
    console.error(`budget: ${file} not found. Run \`next build\` first, and keep ${route} prerendered.`);
    process.exit(1);
  }
  const html = readFileSync(file);
  const assets = new Set(html.toString().match(/\/_next\/static\/[^"'\s)]+/g) ?? []);
  let total = gz(html);
  for (const asset of assets) {
    const path = join(".next", decodeURIComponent(asset.replace(/^\/_next/, "")));
    if (existsSync(path)) total += gz(readFileSync(path));
  }
  const ok = total <= maxBytes;
  failed ||= !ok;
  console.log(
    `budget ${ok ? "ok  " : "FAIL"} ${route}: ${(total / KB).toFixed(1)} KB of ${maxBytes / KB} KB (${assets.size} assets)`,
  );
}

process.exit(failed ? 1 : 0);
