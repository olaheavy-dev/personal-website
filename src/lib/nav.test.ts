import { activeNavItem, wayBackLinks } from "./nav";
import { pageRegistry } from "./flags/registry";
import { configuredProfiles, site } from "./site";

describe("activeNavItem", () => {
  it("matches the exact path only (closes #87)", () => {
    expect(activeNavItem("/work", pageRegistry)?.label).toBe("Work");
    expect(activeNavItem("/work/nope", pageRegistry)).toBeUndefined();
    expect(activeNavItem("/work/optty", pageRegistry)).toBeUndefined();
    expect(activeNavItem("/workshop", pageRegistry)).toBeUndefined();
    expect(activeNavItem("/", pageRegistry)).toBeUndefined();
  });

  it("finds nothing when the item is not in the list", () => {
    expect(
      activeNavItem(
        "/work",
        pageRegistry.filter((item) => item.href !== "/work"),
      ),
    ).toBeUndefined();
  });
});

describe("wayBackLinks", () => {
  it("offers Home and Work, and drops Work when Work is hidden", () => {
    expect(wayBackLinks(pageRegistry).map((link) => link.href)).toEqual(["/", "/work"]);
    expect(wayBackLinks(pageRegistry.filter((item) => item.href !== "/work")).map((l) => l.href)).toEqual([
      "/",
    ]);
    expect(wayBackLinks([]).map((link) => link.href)).toEqual(["/"]);
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
