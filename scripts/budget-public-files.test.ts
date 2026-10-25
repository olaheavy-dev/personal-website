import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { referencedPublicFiles } from "./budget-public-files.mjs";

// A throwaway public/ folder with a logo, the portrait and a file outside it.
const base = mkdtempSync(join(tmpdir(), "budget-public-"));
const publicDir = join(base, "public");
mkdirSync(join(publicDir, "logos"), { recursive: true });
mkdirSync(join(publicDir, "images"));
writeFileSync(join(publicDir, "logos", "hbk.svg"), "<svg/>");
writeFileSync(join(publicDir, "logos", "a b.svg"), "<svg/>");
writeFileSync(join(publicDir, "images", "me.jpg"), "jpg");
writeFileSync(join(base, "secret.txt"), "no");

describe("referencedPublicFiles", () => {
  it("finds files named by url(...) in a stylesheet, with or without quotes", () => {
    const css = `.a{mask:url(/logos/hbk.svg)}.b{background:url("/images/me.jpg")}.c{x:url( '/logos/hbk.svg' )}`;
    expect(referencedPublicFiles([css], publicDir)).toEqual(["/images/me.jpg", "/logos/hbk.svg"]);
  });

  it("finds files named by src, href, poster and srcset in the HTML", () => {
    const html = `<img src="/images/me.jpg"><link href="/logos/hbk.svg"><img srcset="/logos/a%20b.svg 1x, /images/me.jpg 2x">`;
    expect(referencedPublicFiles([html], publicDir)).toEqual([
      "/images/me.jpg",
      "/logos/a b.svg",
      "/logos/hbk.svg",
    ]);
  });

  it("counts each file once, across the HTML and the stylesheets", () => {
    expect(
      referencedPublicFiles([`<img src="/logos/hbk.svg">`, `a{mask:url(/logos/hbk.svg)}`], publicDir),
    ).toEqual(["/logos/hbk.svg"]);
  });

  it("ignores query strings and fragments", () => {
    expect(referencedPublicFiles([`a{mask:url(/logos/hbk.svg?v=2#x)}`], publicDir)).toEqual([
      "/logos/hbk.svg",
    ]);
  });

  it("skips other origins, built assets, pages and files that do not exist", () => {
    const html = [
      `<img src="https://example.com/logos/hbk.svg">`,
      `<img src="//example.com/logos/hbk.svg">`,
      `<link href="/_next/static/chunks/a.css">`,
      `<a href="/work">Work</a>`,
      `<img src="/logos/missing.svg">`,
      `a{background:url(../media/font.woff2)}`,
      `a{background:url(data:image/png;base64,AAAA)}`,
    ].join("");
    expect(referencedPublicFiles([html], publicDir)).toEqual([]);
  });

  it("never reaches outside public/", () => {
    expect(
      referencedPublicFiles([`<img src="/../secret.txt"><img src="/logos/../../secret.txt">`], publicDir),
    ).toEqual([]);
  });
});
