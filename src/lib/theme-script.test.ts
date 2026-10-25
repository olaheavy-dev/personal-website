import { afterEach, describe, expect, it, vi } from "vitest";
import { applySavedTheme } from "./theme-script";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("applySavedTheme", () => {
  it.each(["light", "dark"])("applies a saved %s theme", (theme) => {
    localStorage.setItem("theme", theme);
    applySavedTheme();
    expect(document.documentElement).toHaveAttribute("data-theme", theme);
  });

  it("leaves the system theme alone when nothing valid is saved", () => {
    applySavedTheme();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    localStorage.setItem("theme", "sepia");
    applySavedTheme();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => applySavedTheme()).not.toThrow();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
