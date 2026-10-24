import { activeNavItem, navItems } from "./nav";
import { configuredProfiles, site } from "./site";

describe("navItems", () => {
  it("lists the five sections in navigation order", () => {
    expect(navItems.map((item) => item.label)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
  });
});

describe("activeNavItem", () => {
  it("matches a section and its sub-pages, but not look-alike paths", () => {
    expect(activeNavItem("/work")?.label).toBe("Work");
    expect(activeNavItem("/work/optty")?.label).toBe("Work");
    expect(activeNavItem("/workshop")).toBeUndefined();
    expect(activeNavItem("/")).toBeUndefined();
  });
});

describe("configuredProfiles", () => {
  it("keeps only profiles with a URL, in order", () => {
    expect(
      configuredProfiles([
        { key: "github", label: "GitHub", url: "https://github.com/olaheavy-dev" },
        { key: "linkedin", label: "LinkedIn", url: null },
        { key: "x", label: "X", url: "https://x.com/example" },
      ]).map((profile) => profile.key),
    ).toEqual(["github", "x"]);
  });

  it("shows every profile, GitHub first", () => {
    expect(configuredProfiles(site.profiles).map((profile) => profile.key)).toEqual([
      "github",
      "linkedin",
      "hashnode",
      "x",
    ]);
  });
});
