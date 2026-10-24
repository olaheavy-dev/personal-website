import Link from "next/link";
import { navItems } from "@/lib/nav";
import { configuredProfiles, site } from "@/lib/site";

// Every page ends here. Only profiles with a URL set are shown (settings, #5
// and #27); the passport indicator joins in #21.
export function Footer() {
  const profiles = configuredProfiles();

  return (
    <footer className="mt-(--section-gap) border-t border-border-primary">
      <div className="mx-auto grid w-full max-w-wide gap-10 px-(--gutter) py-12 md:grid-cols-3 md:gap-8">
        <div>
          <p className="font-display text-lg tracking-tight">{site.name}</p>
          <p className="mt-2 text-sm text-text-secondary">{site.oneLiner}</p>
          <a
            href={`mailto:${site.email}`}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-lilac-text underline underline-offset-4 hover:no-underline"
          >
            {site.email}
          </a>
        </div>

        <nav aria-label="Footer">
          <h2 className="label-mono text-text-tertiary">Sections</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="label-mono text-text-tertiary">Elsewhere</h2>
          <ul className="mt-3 flex flex-col">
            {profiles.map((profile) => (
              <li key={profile.key}>
                <a
                  href={profile.url ?? undefined}
                  rel="noopener me"
                  target="_blank"
                  className="inline-flex min-h-11 items-center text-sm hover:underline"
                >
                  {profile.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
            {site.resumeUrl ? (
              <li>
                <a
                  href={site.resumeUrl}
                  className="inline-flex min-h-11 items-center text-sm hover:underline"
                >
                  Résumé (PDF)
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-secondary">
        <p className="mx-auto flex w-full max-w-wide flex-wrap justify-between gap-2 px-(--gutter) py-6 text-xs text-text-tertiary">
          <span>
            © {site.copyrightSince} {site.name}. All rights reserved.
          </span>
          <span>Built with Next.js, tested in CI, deployed on my own server.</span>
        </p>
      </div>
    </footer>
  );
}
