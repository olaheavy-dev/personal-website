import Link from "next/link";
import { site } from "@/lib/site";
import { EmailButton } from "./EmailButton";
import { ThemeToggle } from "./ThemeToggle";

// Hero-slice header. The full floating PillNav (5 sections, sliding active
// pill, ⌘K, scroll condensing, mobile dock) replaces the middle of this bar
// in the "Floating pill nav + footer" task.
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-wide items-center justify-between gap-4 px-(--gutter) pt-4 md:pt-6">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border-strong bg-bg-elevated py-1 pr-4 pl-1 text-sm font-semibold"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 18KB pre-optimised asset */}
        <img
          src="/images/sunkanmi-256.jpg"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-full object-cover"
        />
        <span>{site.name}</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="hidden sm:inline-flex">
          <EmailButton />
        </span>
      </div>
    </header>
  );
}
