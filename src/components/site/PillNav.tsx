"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { activeNavItem, navItems } from "@/lib/nav";

type Indicator = { left: number; width: number } | null;

// Desktop: the five sections in a pill, with a lilac indicator that slides to
// the active item. Before hydration (and with JavaScript off) the active link
// carries the lilac itself, so the server HTML is already correct.
export function PillNav() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<Indicator>(null);

  const measure = useCallback(() => {
    // Measure the link's list item: each item is positioned, so the link's own
    // offsetLeft would always be 0.
    const item = listRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]')?.parentElement;
    setIndicator(item ? { left: item.offsetLeft, width: item.offsetWidth } : null);
  }, []);

  useLayoutEffect(measure, [measure, pathname]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul
        ref={listRef}
        data-indicator={indicator ? "ready" : undefined}
        className="relative flex items-center gap-1 rounded-full border border-border-strong bg-bg-elevated p-1"
      >
        {indicator ? (
          <li
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-lilac transition-[left,width] duration-(--duration-normal) ease-out-expo motion-reduce:transition-none"
            style={{ left: indicator.left, width: indicator.width }}
          />
        ) : null}
        {navItems.map((item) => {
          const isActive = item.href === active?.href;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? `text-text-on-accent ${indicator ? "" : "bg-lilac"}`
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Below 768 px: a Menu button with a disclosure panel. The bottom dock (#28)
// replaces it later.
export function MobileMenu() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = "mobile-menu";

  // Close the menu when the route changes (adjusting state during render, as
  // React recommends, rather than in an effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-bg-elevated px-4 text-sm font-medium"
      >
        {open ? "Close" : "Menu"}
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>
      <nav
        id={panelId}
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-(--gutter) top-full mt-2 rounded-lg border border-border-strong bg-bg-elevated p-2 shadow-lg"
      >
        <ul className="flex flex-col">
          {navItems.map((item) => {
            const isActive = item.href === active?.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-md px-4 text-base font-medium ${
                    isActive ? "bg-lilac text-text-on-accent" : "hover:bg-bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
