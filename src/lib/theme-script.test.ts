import { afterEach, describe, expect, it, vi } from "vitest";
import { applySavedTheme, openDeepLinkedTicket, themeScript } from "./theme-script";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.head.querySelectorAll("style[data-deep-link]").forEach((style) => style.remove());
  window.history.replaceState(null, "", "/");
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

describe("openDeepLinkedTicket", () => {
  const rules = () => [...document.head.querySelectorAll("style[data-deep-link]")].map((s) => s.textContent);

  it("opens the ticket a slug hash names, until hydration, with no transition", () => {
    window.history.replaceState(null, "", "/work#galooli");
    openDeepLinkedTicket();
    expect(rules()).toEqual([
      'li[id="galooli"] .ticket-expander:not([data-hydrated]){grid-template-rows:1fr;transition:none}',
    ]);
  });

  it("removes the rule at the first hash change, so :target decides again", () => {
    window.history.replaceState(null, "", "/work#galooli");
    openDeepLinkedTicket();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(rules()).toEqual([]);
  });

  it("accepts slugs with hyphens and digits", () => {
    window.history.replaceState(null, "", "/work#stanbic-ibtc-2");
    openDeepLinkedTicket();
    expect(rules()[0]).toContain('li[id="stanbic-ibtc-2"]');
  });

  it.each(["", "#", "#Galooli", '#a"]{}*{color:red}', "#a--b", "#-a", "#a b", "#%22"])(
    "adds nothing for %j, so a hash cannot inject CSS",
    (hash) => {
      window.history.replaceState(null, "", `/work${hash}`);
      openDeepLinkedTicket();
      expect(rules()).toEqual([]);
    },
  );

  it("is part of the script that runs before first paint", () => {
    window.history.replaceState(null, "", "/work#mukuru");
    new Function(themeScript)();
    expect(rules()[0]).toContain('li[id="mukuru"]');
  });
});
