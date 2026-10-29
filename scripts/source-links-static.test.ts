import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { STATIC_SOURCES } from "./check-source-links.mjs";

// URLs in `src` that are not cited sources: the site itself, social profiles, own repositories
// (checked as Lab links from the database) and links inside documentation comments.
const NOT_SOURCES = new Set([
  "https://olaheavy.dev",
  "https://github.com/olaheavy-dev",
  "https://github.com/olaheavy-dev/fastpilot",
  "https://github.com/olaheavy-dev/Foresight",
  "https://hashnode.com/",
  "https://www.linkedin.com/",
  "https://x.com/",
  "https://caddyserver.com/docs/caddyfile/directives/reverse_proxy",
]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("hard-coded source URLs (A9)", () => {
  it("every https URL in src is in the checker's static list or the reviewed exceptions", () => {
    const known = new Set([...STATIC_SOURCES.map((s) => s.url), ...NOT_SOURCES]);
    const unknown: string[] = [];
    for (const file of walk("src")) {
      for (const [url] of readFileSync(file, "utf8").matchAll(/https:\/\/[A-Za-z0-9./_?=&%#-]+/g)) {
        if (!known.has(url)) unknown.push(`${file}: ${url}`);
      }
    }
    expect(unknown, "add a new cited source to STATIC_SOURCES in scripts/check-source-links.mjs").toEqual([]);
  });
});
