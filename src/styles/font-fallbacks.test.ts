import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The font stacks in tokens.css name fallback families that only exist in font-fallbacks.css. A typo
// there would silently drop the size matching (and bring back the layout shift on a late font).
const tokens = readFileSync("src/styles/tokens.css", "utf8");
const fallbacks = readFileSync("src/styles/font-fallbacks.css", "utf8");

const declared = new Set([...fallbacks.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]));
const stacks = [...tokens.matchAll(/--font-family-(?:display|body|mono):([^;]+);/g)].map((m) => m[1]!);
const named = stacks.flatMap((stack) => [...stack.matchAll(/"([^"]+)"/g)].map((m) => m[1]!));

describe("font fallbacks", () => {
  it("has a stack for display, body and mono", () => {
    expect(stacks).toHaveLength(3);
  });

  it("declares every fallback family the font stacks name", () => {
    const fallbackNames = named.filter((name) => name.includes("Fallback"));
    expect(fallbackNames.length).toBeGreaterThan(0);
    for (const name of fallbackNames) expect(declared, name).toContain(name);
  });

  it("gives every rule all four size descriptors", () => {
    const rules = fallbacks.split("@font-face").slice(1);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      for (const descriptor of ["size-adjust", "ascent-override", "descent-override", "line-gap-override"]) {
        expect(rule, descriptor).toContain(descriptor);
      }
    }
  });
});
