import { describe, expect, it } from "vitest";
import { labPagesEnabled } from "./lab-pages";

describe("labPagesEnabled", () => {
  it("criterion 8: is on only when LAB_PAGES is exactly 1", () => {
    expect(labPagesEnabled({ LAB_PAGES: "1" })).toBe(true);
    for (const value of [undefined, "", "0", "true", "yes", " 1"]) {
      expect(labPagesEnabled({ LAB_PAGES: value })).toBe(false);
    }
    expect(labPagesEnabled({})).toBe(false);
  });
});
