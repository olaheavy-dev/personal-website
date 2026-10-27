import { coversLatin, downloadedAssets, inlinedStylesheets } from "./budget-assets.mjs";

const face = (file: string, range?: string) =>
  `@font-face{font-family:X;src:url(/_next/static/media/${file}.woff2)format("woff2")${range ? `;unicode-range:${range}` : ""}}`;
const latin = "/_next/static/media/latin.woff2";
const ext = "/_next/static/media/ext.woff2";
const cyrillic = "/_next/static/media/cyr.woff2";
const css = [
  face("latin", "U+??,U+131,U+152-153,U+2000-206F"),
  face("ext", "U+100-2BA,U+2BD-2C5,U+1E00-1E9F"),
  face("cyr", "U+301,U+400-45F,U+490-491"),
].join("\n");

describe("inlinedStylesheets", () => {
  it("lists the data-href of each inline <style>, and nothing else", () => {
    const html = `<link rel="stylesheet" href="/_next/static/a.css"><style data-precedence="next" data-href="/_next/static/b.css">x</style><style>y</style>`;
    expect([...inlinedStylesheets(html)]).toEqual(["/_next/static/b.css"]);
  });
});

describe("coversLatin", () => {
  it("counts the Basic Latin subset, including the ?? wildcard and a range starting at 0", () => {
    expect(coversLatin("U+??,U+131,U+2212")).toBe(true);
    expect(coversLatin("U+0000-00FF,U+0131")).toBe(true);
    expect(coversLatin("U+20-7E")).toBe(true);
  });

  it("does not count Latin Extended, Vietnamese, Cyrillic or Greek", () => {
    expect(coversLatin("U+100-2BA,U+2BD-2C5")).toBe(false);
    expect(coversLatin("U+102-103,U+110-111,U+1EA0-1EF9")).toBe(false);
    expect(coversLatin("U+301,U+400-45F")).toBe(false);
    expect(coversLatin("U+370-377,U+37A-37F")).toBe(false);
    expect(coversLatin("U+1??")).toBe(false);
  });

  it("counts a range it cannot read, so the budget errs high", () => {
    expect(coversLatin("U+zz")).toBe(true);
  });
});

describe("downloadedAssets", () => {
  const html = `<style data-href="/_next/static/chunks/a.css">${css}</style>`;

  it("does not count a stylesheet already inlined in the HTML, and counts one that is linked", () => {
    const assets = [
      "/_next/static/chunks/a.css",
      "/_next/static/chunks/other.css",
      "/_next/static/chunks/x.js",
    ];
    expect(downloadedAssets(assets, html, [css])).toEqual([
      "/_next/static/chunks/other.css",
      "/_next/static/chunks/x.js",
    ]);
  });

  it("counts a Latin subset and skips a non-Latin one", () => {
    expect(downloadedAssets([latin, ext, cyrillic], html, [css])).toEqual([latin]);
  });

  it("counts a preloaded font whatever its range, and a font whose face it cannot find", () => {
    const withPreload = `${html}<link rel="preload" href="${ext}" as="font" type="font/woff2"/>`;
    expect(downloadedAssets([ext], withPreload, [css])).toEqual([ext]);
    expect(downloadedAssets(["/_next/static/media/unknown.woff2"], html, [css])).toEqual([
      "/_next/static/media/unknown.woff2",
    ]);
  });

  it("counts a face with no unicode-range", () => {
    expect(downloadedAssets([latin], html, [face("latin")])).toEqual([latin]);
  });
});
