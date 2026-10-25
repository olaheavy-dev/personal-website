"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/nav";
import { site } from "@/lib/site";
import { EmailButton } from "./EmailButton";
import { MobileMenu, PillNav } from "./PillNav";
import { ThemeToggle } from "./ThemeToggle";

// Sticky header: brand pill, the pill nav (desktop) or Menu (mobile), theme
// toggle and Email me. Once the page scrolls it gains a soft backdrop and
// shadow so it stays readable over content. The ⌘K trigger joins it in #20.
//
// The header's box never changes size, so nothing below it moves while the page
// scrolls (it used to shrink its padding, which made the page 16 to 32 px shorter).
// The condensed look is made without layout: the sticky offset is negative, so the
// header parks a little above the viewport top, and the backdrop is a ::before layer
// inset by the same amount, which only fades in. The box is taller than the visible
// bar, so the header ignores the pointer and only its three children take it.
//
// Three heights exist: the box (76 px phone, 98 px md), the visible scrolled bar
// (60 or 66 px) and --nav-height. A future sticky element (Work filter chips, a
// case study TOC) should sit below the visible scrolled bar, not the box.
export function SiteHeader({ items }: { items: readonly NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "" : undefined}
      className={`pointer-events-none sticky -top-2 z-(--z-nav) before:absolute before:inset-x-0 before:inset-y-2 before:-z-10 before:bg-bg-primary/85 before:shadow-sm before:backdrop-blur-md before:transition-opacity before:duration-(--duration-normal) before:content-[''] md:-top-4 md:before:inset-y-4 ${
        scrolled ? "before:opacity-100" : "before:opacity-0"
      }`}
    >
      <div className="relative mx-auto flex w-full max-w-wide items-center justify-between gap-4 px-(--gutter) py-4 md:py-6 [&>*]:pointer-events-auto">
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-full border border-border-strong bg-bg-elevated py-1 pr-4 pl-1 text-sm font-semibold"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 16KB pre-optimised asset */}
          <img
            src="/images/sunkanmi-256.jpg"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
          <span className="hidden sm:inline">{site.name}</span>
          <span className="sm:hidden">{site.firstName}</span>
        </Link>
        <PillNav items={items} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden lg:inline-flex">
            <EmailButton />
          </span>
          <span className="inline-flex lg:hidden">
            <EmailButton size="icon" />
          </span>
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}
