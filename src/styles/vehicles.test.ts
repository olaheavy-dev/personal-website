import { readFileSync } from "node:fs";
import { join } from "node:path";

// Contrast for the Work route vehicles (issue #66), in the style of the logo colour tests. The
// three body colours are one value in both themes; the outline is --color-border-strong (ink in
// light, light grey in dark), and stripes, wheels and bumpers are --ink-900 in both.
const root = process.cwd();
const files = ["src/styles/tokens.css", ".design/portfolio/DESIGN_TOKENS.css"];
const read = (path: string) => readFileSync(join(root, path), "utf8");

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

/** A token's hex value: looked up in `scope` first (a theme block), then in the whole file, following var() chains. */
function hex(whole: string, scope: string, name: string): string {
  const match =
    scope.match(new RegExp(`${name}:\\s*([^;]+);`)) ?? whole.match(new RegExp(`${name}:\\s*([^;]+);`));
  expect(match, name).not.toBeNull();
  const value = match![1]!.replace(/\/\*.*$/, "").trim();
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return (ref ? hex(whole, scope, ref[1]!) : value).toLowerCase();
}

const bodies = ["--color-danfo", "--color-danfo-band", "--color-bus"] as const;

describe.each(files)("vehicle colours in %s", (path) => {
  const text = read(path);
  const darkAt = text.indexOf('\n[data-theme="dark"] {');
  const lightScope = text.slice(0, darkAt);
  // The dark block runs up to the system dark fallback's media query.
  const darkScope = text.slice(darkAt, text.indexOf("@media (prefers-color-scheme: dark)", darkAt));
  const ink = hex(text, lightScope, "--ink-900");
  const lightPage = hex(text, lightScope, "--color-bg-primary");
  const darkPage = hex(text, darkScope, "--color-bg-primary");
  const lightOutline = hex(text, lightScope, "--color-border-strong");
  const darkOutline = hex(text, darkScope, "--color-border-strong");

  it("defines the three colours once, with the owner's values, so both themes share them", () => {
    expect(hex(text, "", "--color-danfo")).toBe("#f5c518");
    expect(hex(text, "", "--color-danfo-band")).toBe("#c8961a");
    expect(hex(text, "", "--color-bus")).toBe("#dc241f");
    for (const name of bodies) expect(text.match(new RegExp(`${name}:`, "g")), name).toHaveLength(1);
  });

  it("keeps the outline at least 3:1 against the page in light and in dark", () => {
    expect(contrast(lightOutline, lightPage)).toBeGreaterThanOrEqual(3);
    expect(contrast(darkOutline, darkPage)).toBeGreaterThanOrEqual(3);
  });

  it("keeps each body colour at least 3:1 against what separates it from the page", () => {
    // Light: the ink outline separates a yellow body from the paper. Dark: the outline is light
    // grey, so the body is separated from the dark page itself (the grey outline sits between).
    for (const name of bodies) {
      const colour = hex(text, "", name);
      expect(contrast(colour, lightOutline), `${name} against the light outline`).toBeGreaterThanOrEqual(3);
      expect(contrast(colour, darkPage), `${name} against the dark page`).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps each body colour at least 3:1 against the ink stripes, wheels and bumpers", () => {
    for (const name of bodies) expect(contrast(hex(text, "", name), ink), name).toBeGreaterThanOrEqual(3);
  });
});

it("keeps both token files' vehicle values identical", () => {
  const [a, b] = files.map(read) as [string, string];
  for (const name of [...bodies, "--vehicle-danfo-width", "--vehicle-bus-width", "--danfo-pin-size"]) {
    const value = (text: string) => text.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();
    expect(value(a), name).toBeDefined();
    expect(value(a), name).toBe(value(b));
  }
});
