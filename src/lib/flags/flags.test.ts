import { pageRegistry, visiblePages } from "./registry";
import { getViewer, isFlagVisible, isVisible } from "./visibility";

describe("isVisible", () => {
  it("shows On to everyone", () => {
    expect(isVisible("on", "public")).toBe(true);
    expect(isVisible("on", "owner")).toBe(true);
  });

  it("shows Preview to the owner only", () => {
    expect(isVisible("preview", "owner")).toBe(true);
    expect(isVisible("preview", "public")).toBe(false);
  });

  it("hides Off and a missing key from everyone", () => {
    for (const viewer of ["public", "owner"] as const) {
      expect(isVisible("off", viewer)).toBe(false);
      expect(isVisible(undefined, viewer)).toBe(false);
    }
  });
});

describe("getViewer", () => {
  it("is public until Auth (#23), so Preview behaves as Off", async () => {
    expect(await getViewer()).toBe("public");
  });
});

describe("isFlagVisible", () => {
  it("looks the key up and treats a missing key as off", () => {
    expect(isFlagVisible({ "page.work": "on" }, "page.work", "public")).toBe(true);
    expect(isFlagVisible({ "page.work": "on" }, "page.lab", "public")).toBe(false);
    expect(isFlagVisible({ "page.work": "preview" }, "page.work", "public")).toBe(false);
  });
});

describe("pageRegistry", () => {
  it("lists the five sections in navigation order", () => {
    expect(pageRegistry.map((page) => page.label)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
    expect(pageRegistry.map((page) => page.href)).toEqual(["/work", "/lab", "/writing", "/travel", "/about"]);
  });

  it("keys every page by its own flag", () => {
    for (const page of pageRegistry) expect(page.flag).toBe(`page${page.href.replace("/", ".")}`);
  });
});

describe("visiblePages", () => {
  const all = {
    "page.work": "on",
    "page.lab": "on",
    "page.writing": "on",
    "page.travel": "on",
    "page.about": "on",
  } as const;

  it("keeps the pages that are on, in navigation order", () => {
    expect(visiblePages(all, "public").map((page) => page.label)).toEqual([
      "Work",
      "Lab",
      "Writing",
      "Travel",
      "About",
    ]);
    expect(visiblePages({ ...all, "page.lab": "off" }, "public").map((page) => page.label)).toEqual([
      "Work",
      "Writing",
      "Travel",
      "About",
    ]);
  });

  it("hides Preview from the public and shows it to the owner", () => {
    const flags = { ...all, "page.travel": "preview" } as const;
    expect(visiblePages(flags, "public").map((page) => page.label)).not.toContain("Travel");
    expect(visiblePages(flags, "owner").map((page) => page.label)).toContain("Travel");
  });

  it("is empty when no flag is set", () => {
    expect(visiblePages({}, "public")).toEqual([]);
  });
});
