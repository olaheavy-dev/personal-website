"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { EmailButton } from "./EmailButton";
import { MobileMenu, PillNav } from "./PillNav";
import { ThemeToggle } from "./ThemeToggle";

// Sticky header: brand pill, the pill nav (desktop) or Menu (mobile), theme
// toggle and Email me. Once the page scrolls it gains a soft backdrop and
// shadow so it stays readable over content. The ⌘K trigger joins it in #20.
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "" : undefined}
      className={`sticky top-0 z-(--z-nav) transition-[background-color,box-shadow] duration-(--duration-normal) ${
        scrolled ? "bg-bg-primary/85 shadow-sm backdrop-blur-md" : ""
      }`}
    >
      <div
        className={`relative mx-auto flex w-full max-w-wide items-center justify-between gap-4 px-(--gutter) transition-[padding] duration-(--duration-normal) ${
          scrolled ? "py-2" : "py-4 md:py-6"
        }`}
      >
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
        <PillNav />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden lg:inline-flex">
            <EmailButton />
          </span>
          <span className="inline-flex lg:hidden">
            <EmailButton size="icon" />
          </span>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
