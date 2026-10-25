// What the navigation and the 404's way back need to know about a page. The list itself
// is the flag registry (src/lib/flags/registry.ts): a page switched off by its flag is
// not in it, so it is missing from here too.

export type NavItem = {
  href: `/${string}`;
  label: string;
  status: "live" | "coming-soon";
};

export type WayBackLink = { href: "/" | "/work"; label: string; note: string };

/**
 * The places the 404 offers as a way back: Home, then Work when Work is in the
 * navigation. A section switched off by a flag drops out of `items`, so it disappears
 * from here too and the route leaves no dangling leg.
 */
export function wayBackLinks(items: readonly NavItem[]): WayBackLink[] {
  const links: WayBackLink[] = [{ href: "/", label: "Home", note: "Who I am and how I work" }];
  if (items.some((item) => item.href === "/work")) {
    links.push({ href: "/work", label: "Work", note: "The full route, stop by stop" });
  }
  return links;
}

/**
 * The nav item a pathname is. It matches the exact path only: an unknown address such as
 * `/work/nope` marks nothing, so the bar never claims a place the visitor is not on
 * (closes #87). A section with real sub-pages will list them when it ships.
 */
export function activeNavItem(pathname: string, items: readonly NavItem[]): NavItem | undefined {
  return items.find((item) => pathname === item.href);
}
