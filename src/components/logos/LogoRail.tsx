import { LogoMark } from "@/components/logos/LogoMark";
import { railItems, type Logo } from "@/lib/logos";

function Cell({ logo }: { logo: Logo }) {
  return (
    <li className="logo-cell" data-logo-cell={logo.slug}>
      <LogoMark logo={logo} />
      <span className="sr-only">{logo.name}</span>
    </li>
  );
}

// Server component, no interaction: the logos are not links, take no focus and do not move.
export function LogoRail() {
  return (
    <section
      id="shipped"
      aria-labelledby="shipped-title"
      className="mx-auto w-full max-w-wide px-(--gutter) pt-4 pb-8 md:pb-10"
    >
      <h2 id="shipped-title" className="label-mono text-text-tertiary">
        Where I&apos;ve shipped
      </h2>
      <ul className="logo-rail mt-6">
        {railItems.map((item) =>
          item.kind === "logo" ? (
            <Cell key={item.logo.slug} logo={item.logo} />
          ) : (
            <li key={item.via.slug} className="logo-group">
              <div className="logo-group-label label-mono">
                <span>via</span>
                <LogoMark logo={item.via} />
                <span className="sr-only">{item.via.name}</span>
              </div>
              <ul className="logo-group-list">
                {item.logos.map((logo) => (
                  <Cell key={logo.slug} logo={logo} />
                ))}
              </ul>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
