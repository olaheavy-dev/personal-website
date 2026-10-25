import type { Logo } from "@/lib/logos";

/**
 * One company mark, drawn through a CSS mask so it takes a single token colour.
 * The file, size and hover colour come from `[data-logo]` rules in src/styles/logo-rail.css.
 * The mark is decorative: the company's name is text beside it.
 */
export function LogoMark({ logo }: { logo: Logo }) {
  return <span className="logo-mark" data-logo={logo.slug} aria-hidden="true" />;
}
