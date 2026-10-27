// Fails unless every Playwright image digest in .github/workflows is the same.
//
// The e2e and visual jobs in ci.yml and the smoke job in post-deploy-smoke.yml all run in the
// pinned Playwright image. If a bump updates one and not the others, the jobs would silently run
// different browsers (and the visual baselines would drift). This keeps the digests in step.
// Whether the image matches @playwright/test is checked at run time by
// scripts/check-playwright-container.sh.
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const directory = ".github/workflows";
const imagePattern = /mcr\.microsoft\.com\/playwright@sha256:[0-9a-f]{64}/g;

/** @param {Record<string, string>} files workflow file name to its text */
export function findImageProblems(files) {
  /** @type {Map<string, string[]>} */
  const found = new Map();
  for (const [name, text] of Object.entries(files)) {
    for (const image of text.match(imagePattern) ?? []) {
      found.set(image, [...(found.get(image) ?? []), name]);
    }
  }
  const problems = [];
  if (found.size === 0) {
    problems.push(
      "no pinned Playwright image (mcr.microsoft.com/playwright@sha256:...) found in the workflows.",
    );
  }
  if (found.size > 1) {
    problems.push(
      "the workflows pin different Playwright images. Use one digest everywhere:",
      ...[...found].map(([image, names]) => `  ${image} in ${[...new Set(names)].join(", ")}`),
    );
  }
  return problems;
}

function main() {
  const files = {};
  for (const name of readdirSync(directory)) {
    if (name.endsWith(".yml") || name.endsWith(".yaml")) {
      files[name] = readFileSync(join(directory, name), "utf8");
    }
  }
  const problems = findImageProblems(files);
  if (problems.length) {
    console.error("check-playwright-image:");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("check-playwright-image: every workflow pins the same Playwright image.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
