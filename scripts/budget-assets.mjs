// Which of the files a page's HTML names does a first visit really download? The page budget
// (check-budget.mjs) counts only those, so it measures what a visitor pays and not what the HTML
// merely mentions. Two cases need care since the stylesheet is inlined (`inlineCss`):
//  - the CSS file named in <style data-href="..."> is already inside the HTML, so it is not
//    fetched and must not be counted a second time;
//  - the inlined @font-face rules name every subset of every font, but a browser fetches only the
//    subsets whose unicode-range holds a character on the page. This counts a subset only when its
//    range overlaps Basic Latin and Latin-1 (U+0000 to U+00FF), the text this site is written in,
//    or when it is preloaded, or when its range cannot be read (counted, so the budget errs high).
//    Latin Extended, Vietnamese, Cyrillic and Greek subsets are not. Deterministic: it reads the
//    build output only and never fetches.

/** The `data-href` of every <style> tag in the HTML: stylesheets already inside the page. */
export function inlinedStylesheets(html) {
  const hrefs = new Set();
  for (const tag of html.matchAll(/<style\b[^>]*>/gi)) {
    const match = /\bdata-href\s*=\s*["']([^"']+)["']/i.exec(tag[0]);
    if (match) hrefs.add(match[1]);
  }
  return hrefs;
}

/** True when a `unicode-range` value (for example "U+??,U+131" or "U+100-2BA") reaches U+0000 to U+00FF. */
export function coversLatin(range) {
  for (const part of range.split(",")) {
    const token = part.trim().replace(/^u\+/i, "");
    if (!token) continue;
    let low;
    let high;
    if (token.includes("?")) {
      low = parseInt(token.replaceAll("?", "0"), 16);
      high = parseInt(token.replaceAll("?", "F"), 16);
    } else if (token.includes("-")) {
      [low, high] = token.split("-").map((hex) => parseInt(hex, 16));
    } else {
      low = high = parseInt(token, 16);
    }
    if (Number.isNaN(low) || Number.isNaN(high)) return true; // unreadable: count it
    if (low <= 0xff && high >= 0x00) return true;
  }
  return false;
}

/** The font files the HTML preloads (<link rel="preload" as="font">): fetched on every visit. */
function preloadedFonts(html) {
  const hrefs = new Set();
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\bas\s*=\s*["']font["']/i.test(tag[0])) continue;
    const match = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag[0]);
    if (match) hrefs.add(match[1]);
  }
  return hrefs;
}

/**
 * The first-load assets among `assets` (the /_next/static/... paths found in the HTML): those the
 * visitor downloads. `cssTexts` is every stylesheet text, inline or not, to read @font-face from.
 */
export function downloadedAssets(assets, html, cssTexts) {
  const inlined = inlinedStylesheets(html);
  const preloaded = preloadedFonts(html);
  // woff2 path -> whether any @font-face that names it covers Latin.
  const latin = new Map();
  for (const text of cssTexts) {
    for (const face of text.matchAll(/@font-face\s*\{[^}]*\}/gi)) {
      const range = /unicode-range\s*:\s*([^;}]+)/i.exec(face[0]);
      for (const url of face[0].matchAll(/url\(\s*["']?([^)"']+?\.woff2)["']?\s*\)/gi)) {
        const covers = range ? coversLatin(range[1]) : true;
        latin.set(url[1], latin.get(url[1]) || covers);
      }
    }
  }
  return [...assets].filter((asset) => {
    if (asset.endsWith(".css") && inlined.has(asset)) return false;
    if (asset.endsWith(".woff2") && !preloaded.has(asset) && latin.has(asset)) return latin.get(asset);
    return true;
  });
}
