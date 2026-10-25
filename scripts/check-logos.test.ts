import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Company logos come from outside (each company's own website or files, see
// docs/references/logos.md), so every SVG is checked for anything that could run code
// or load from elsewhere, and the one colour versions for colours other than currentColor.
const dir = join(process.cwd(), "public", "logos");
const files = readdirSync(dir).filter((name) => name.endsWith(".svg"));

describe("company logos", () => {
  it("ships the eight logos and the two one colour versions", () => {
    expect(files.sort()).toEqual([
      "access-bank.svg",
      "deimos.svg",
      "galooli.svg",
      "hbk.svg",
      "mukuru.svg",
      "optty.svg",
      "stanbic-ibtc-mono.svg",
      "stanbic-ibtc.svg",
      "ulesson-mono.svg",
      "ulesson.svg",
    ]);
  });

  it.each(files)("%s has no script, handler, embedded image or outside reference", (name) => {
    const svg = readFileSync(join(dir, name), "utf8");
    expect(svg).toMatch(/<svg[\s>]/);
    expect(svg).toMatch(/viewBox="/);
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
    expect(svg).not.toMatch(/<(image|foreignObject|iframe|use)\b[^>]*(href|src)\s*=\s*"(?!#)/i);
    expect(svg).not.toMatch(/(href|src)\s*=\s*"(https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/url\(\s*['"]?(https?:|data:|\/\/)/i);
  });

  it.each(files.filter((name) => name.endsWith("-mono.svg")))(
    "%s draws every visible shape in currentColor",
    (name) => {
      const svg = readFileSync(join(dir, name), "utf8");
      const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]);
      const outsideMasks = svg.replace(/<mask[\s\S]*?<\/mask>/g, "");
      const visible = [...outsideMasks.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]);
      expect(fills.length).toBeGreaterThan(0);
      expect(visible.every((fill) => fill === "currentColor" || fill === "none")).toBe(true);
      expect(svg).not.toMatch(/Gradient/);
    },
  );
});
