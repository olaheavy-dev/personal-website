import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allLogos, deimos, NUDGE_MAX, NUDGE_MIN, railItems } from "@/lib/logos";
import { config } from "@/proxy";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const css = read("src/styles/logo-rail.css");

/** The `[data-logo="slug"] { ... }` rule's custom properties, read from the stylesheet. */
function cssRule(slug: string) {
  const match = css.match(new RegExp(`\\[data-logo="${slug}"\\] \\{([^}]*)\\}`));
  expect(match, `a [data-logo="${slug}"] rule in logo-rail.css`).not.toBeNull();
  const body = match![1]!;
  const value = (name: string) => body.match(new RegExp(`--logo-${name}:\\s*([^;]+);`))?.[1]?.trim();
  return {
    src: value("src"),
    aspect: Number(value("aspect")),
    nudge: Number(value("nudge")),
    factor: Number(value("width-factor")),
    hover: value("hover"),
  };
}

describe("logo list", () => {
  it("lists newest first, with the three Deimos clients grouped", () => {
    expect(
      railItems.map((item) => (item.kind === "logo" ? item.logo.name : item.logos.map((l) => l.name))),
    ).toEqual(["HBK", ["Mukuru", "uLesson", "Optty"], "Stanbic IBTC", "Access Bank", "Galooli"]);
    const group = railItems.find((item) => item.kind === "group");
    expect(group).toMatchObject({ label: "via Deimos", via: { name: "Deimos" } });
  });

  it("uses the one colour versions for uLesson and Stanbic IBTC", () => {
    const file = (slug: string) => allLogos.find((logo) => logo.slug === slug)?.file;
    expect(file("ulesson")).toBe("ulesson-mono.svg");
    expect(file("stanbic-ibtc")).toBe("stanbic-ibtc-mono.svg");
  });

  it("names the same companies as the seeded stops, in the same slugs", () => {
    const seed = read("supabase/seed.sql");
    const stopSlugs = [...seed.matchAll(/^\s*\('([a-z-]+)', \d+, '[^']+', '(?:compact|flagship)'/gm)].map(
      (m) => m[1],
    );
    expect(stopSlugs.length).toBe(7);
    const railSlugs = allLogos.filter((logo) => logo !== deimos).map((logo) => logo.slug);
    expect([...railSlugs].sort()).toEqual([...stopSlugs].sort());
  });

  it("keeps every nudge between 0.85 and 1.25", () => {
    for (const logo of allLogos) {
      expect(logo.nudge, logo.slug).toBeGreaterThanOrEqual(NUDGE_MIN);
      expect(logo.nudge, logo.slug).toBeLessThanOrEqual(NUDGE_MAX);
    }
  });

  it("gives each file a real aspect from its viewBox", () => {
    for (const logo of allLogos) {
      const svg = read(`public/logos/${logo.file}`);
      const box = svg
        .match(/viewBox="([\d.\s-]+)"/)![1]!
        .trim()
        .split(/\s+/)
        .map(Number) as [number, number, number, number];
      expect(logo.aspect, logo.slug).toBeCloseTo(box[2] / box[3], 6);
    }
  });
});

describe("logo styles", () => {
  it.each(allLogos.map((logo) => [logo.slug, logo] as const))(
    "%s: the stylesheet has the same file, aspect and nudge as the list",
    (_slug, logo) => {
      const rule = cssRule(logo.slug);
      expect(rule.src).toBe(`url("/logos/${logo.file}")`);
      expect(rule.aspect).toBeCloseTo(logo.aspect, 3);
      expect(rule.nudge).toBe(logo.nudge);
      // The precomputed width factor (no sqrt() in the CSS, so every browser draws the rail).
      expect(rule.factor).toBeCloseTo(Math.sqrt(logo.aspect) * logo.nudge, 3);
      // The small Deimos credit is not a client cell, so it has no hover colour.
      expect(rule.hover).toBe(logo === deimos ? undefined : `var(--color-logo-${logo.slug})`);
    },
  );

  it("sizes by equal area: width times height is the same for every client, apart from its nudge", () => {
    // width = unit * factor and height = width / aspect, so area = unit^2 * nudge^2.
    const areas = allLogos
      .filter((logo) => logo !== deimos)
      .map((logo) => {
        const { aspect, nudge, factor } = cssRule(logo.slug);
        const width = factor;
        const height = width / aspect;
        return (width * height) / nudge ** 2;
      });
    for (const area of areas) expect(area).toBeCloseTo(1, 2);
  });

  it("derives the size from a CSS formula, so no style attribute is needed", () => {
    expect(css).toMatch(/width: calc\(var\(--logo-unit\) \* var\(--logo-width-factor\)\)/);
    expect(css).not.toMatch(/sqrt\(/);
    expect(css).toMatch(/aspect-ratio: var\(--logo-aspect\)/);
  });
});

describe("logo files", () => {
  it.each(allLogos.map((logo) => [logo.file] as const))("%s exists and the proxy lets it through", (file) => {
    expect(existsSync(join(root, "public", "logos", file))).toBe(true);
    const skipped = new RegExp(`^${config.matcher[0]}$`);
    // The proxy matcher skips listed files; any other address is rewritten to the 404.
    expect(skipped.test(`/logos/${file}`)).toBe(false);
  });
});

describe("logo hover colours", () => {
  const clients = allLogos.filter((logo) => logo !== deimos);
  const blocks = (path: string) => {
    const text = read(path);
    const colours = (slug: string) =>
      [...text.matchAll(new RegExp(`--color-logo-${slug}:\\s*([^;]+);`, "g"))].map((m) => m[1]!.trim());
    return colours;
  };
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
    return (x + 0.05) / (y + 0.05);
  };

  it.each(["src/styles/tokens.css", ".design/portfolio/DESIGN_TOKENS.css"])(
    "%s defines one token per company for light, dark and the system dark fallback",
    (path) => {
      const colours = blocks(path);
      for (const logo of clients) expect(colours(logo.slug), logo.slug).toHaveLength(3);
      expect(colours("deimos")).toHaveLength(0);
    },
  );

  it("keeps both files' logo colours identical", () => {
    const a = blocks("src/styles/tokens.css");
    const b = blocks(".design/portfolio/DESIGN_TOKENS.css");
    for (const logo of clients) expect(a(logo.slug), logo.slug).toEqual(b(logo.slug));
  });

  it("is readable on the page: at least 3:1 in light and in dark", () => {
    const colours = blocks("src/styles/tokens.css");
    for (const logo of clients) {
      const [light = "", dark = ""] = colours(logo.slug);
      if (light.startsWith("#"))
        expect(contrast(light, "#faf8f5"), `${logo.slug} light`).toBeGreaterThanOrEqual(3);
      if (dark.startsWith("#"))
        expect(contrast(dark, "#131217"), `${logo.slug} dark`).toBeGreaterThanOrEqual(3);
    }
  });
});
