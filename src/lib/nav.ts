// The site's main sections, in navigation order (information architecture).
// `status` says whether the real page has shipped; until then the route shows a
// styled coming soon page. Feature flags (#6) later decide whether an item
// appears at all.

export type NavItem = {
  href: `/${string}`;
  label: string;
  status: "live" | "coming-soon";
};

export const navItems: NavItem[] = [
  { href: "/work", label: "Work", status: "coming-soon" },
  { href: "/lab", label: "Lab", status: "coming-soon" },
  { href: "/writing", label: "Writing", status: "coming-soon" },
  { href: "/travel", label: "Travel", status: "coming-soon" },
  { href: "/about", label: "About", status: "coming-soon" },
];

/** The nav item a pathname belongs to (`/work/optty` belongs to Work), if any. */
export function activeNavItem(pathname: string, items: NavItem[] = navItems): NavItem | undefined {
  return items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
