// Files a page pulls from public/ (logo masks, the portrait), which the page budget must
// count like any other asset. They are found in the page's own HTML (src, href, poster and
// srcset on <link>, <img>, <source>, <video> and <script> only: an <a href> is a link the
// visitor may never follow, not a download) and in url(...) in the HTML or the stylesheets.
// Every stylesheet url() counts as fetched, so the total is an upper bound: a mask no
// section on the page uses is still counted. Only same origin paths count: a full URL, a
// protocol relative one and anything under /_next/ (counted separately) are skipped, and so
// is any path that is not a real file in public/.
import { existsSync, statSync } from "node:fs";
import { join, normalize, sep } from "node:path";

const tag = /<(?:link|img|source|video|script)\b[^>]*>/gi;
const attribute = /\b(?:src|href|poster|srcset)\s*=\s*["']([^"']+)["']/gi;
const cssUrl = /url\(\s*(["']?)([^)"']+)\1\s*\)/gi;

function candidates(text) {
  const found = [];
  for (const element of text.matchAll(tag)) {
    for (const match of element[0].matchAll(attribute)) {
      // srcset holds "path 1x, path 2x"; the others hold one path.
      for (const part of match[1].split(",")) found.push(part.trim().split(/\s+/)[0]);
    }
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
