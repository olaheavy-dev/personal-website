// Files a page pulls from public/ (logo masks, the portrait), which the page budget must
// count like any other asset. They are found from the page's own HTML (src, href, poster,
// srcset and url(...)) and from its stylesheets (url(...)). Only same origin paths count:
// a full URL, a protocol relative one and anything under /_next/ (counted separately) are
// skipped, and so is any path that is not a real file in public/ (a link to /work is a page).
import { existsSync, statSync } from "node:fs";
import { join, normalize, sep } from "node:path";

const attribute = /\b(?:src|href|poster|srcset)\s*=\s*["']([^"']+)["']/gi;
const cssUrl = /url\(\s*(["']?)([^)"']+)\1\s*\)/gi;

function candidates(text) {
  const found = [];
  for (const match of text.matchAll(attribute)) {
    // srcset holds "path 1x, path 2x"; the others hold one path.
    for (const part of match[1].split(",")) found.push(part.trim().split(/\s+/)[0]);
  }
  for (const match of text.matchAll(cssUrl)) found.push(match[2].trim());
  return found;
}

/**
 * The files in `publicDir` that `texts` (a page's HTML and its stylesheets) reference,
 * as paths relative to the site root (for example "/logos/hbk.svg"), without duplicates.
 */
export function referencedPublicFiles(texts, publicDir = "public") {
  const files = new Set();
  const root = normalize(publicDir) + sep;
  for (const text of texts) {
    for (const raw of candidates(text)) {
      if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/_next/")) continue;
      let path;
      try {
        path = decodeURIComponent(raw.split(/[?#]/)[0]);
      } catch {
        continue;
      }
      const file = normalize(join(publicDir, path));
      // A path such as /../secret must never leave public/.
      if (!file.startsWith(root)) continue;
      if (existsSync(file) && statSync(file).isFile()) files.add(path);
    }
  }
  return [...files].sort();
}
