import type { ProfileKey } from "@/lib/site";
import { configuredProfiles, site } from "@/lib/site";
import { CopyEmailButton } from "./CopyEmailButton";
import { EmailButton } from "./EmailButton";

// The route ends at Scale; the footer is the invitation to start the visitor's
// own: a wide ticket with the contact actions and a tear-off stub holding the
// availability and profiles, then one slim line. The header already carries the name and the
// sections, so the footer doesn't repeat them.
export function Footer() {
  const profiles = configuredProfiles();

  return (
    <footer className="mt-(--section-gap)">
      <section aria-labelledby="next-stop-title" className="mx-auto w-full max-w-wide px-(--gutter) pb-12">
        <div className="ticket-drop">
          <div className="ticket ticket-pass flex flex-col md:flex-row">
            <div className="flex-1 px-6 pt-8 pb-8 md:px-10 md:pt-10">
              <p className="label-mono text-text-tertiary">Next stop</p>
              <h2 id="next-stop-title" className="mt-3 text-display-lg leading-display">
                Yours.
              </h2>
              <p className="mt-4 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">
                Hiring for a senior or staff AI role, or building something that has to hold up with real
                users? Tell me about it.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <EmailButton size="lg" />
                <CopyEmailButton />
              </div>
            </div>

            <div aria-hidden="true" className="border-t-2 border-dashed border-border-primary md:hidden" />
            <div className="flex flex-col gap-6 px-6 py-6 md:w-(--ticket-stub-width) md:justify-between md:border-l-2 md:border-dashed md:border-border-primary md:px-7 md:py-10">
              <div>
                <p className="label-mono text-text-tertiary">Availability</p>
                <p className="mt-3 flex max-w-(--max-width-caption) items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-live" aria-hidden="true" />
                  {site.availability}
                </p>
              </div>
              {profiles.length || site.resumeUrl ? (
                <ul aria-label="Profiles" className="flex flex-wrap items-center gap-2">
                  {profiles.map((profile) => (
                    <li key={profile.key}>
                      <a
                        href={profile.url ?? undefined}
                        rel="noopener me"
                        target="_blank"
                        aria-label={`${profile.label} (opens in a new tab)`}
                        title={profile.label}
                        className="grid size-12 place-items-center rounded-full border border-border-strong text-text-primary transition-colors duration-150 hover:bg-bg-secondary"
                      >
                        <ProfileIcon kind={profile.key} />
                      </a>
                    </li>
                  ))}
                  {site.resumeUrl ? (
                    <li>
                      <a
                        href={site.resumeUrl}
                        className="inline-flex min-h-12 items-center rounded-full border border-border-strong px-5 text-sm font-medium transition-colors duration-150 hover:bg-bg-secondary"
                      >
                        Résumé
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border-secondary">
        <div className="mx-auto flex w-full max-w-wide flex-wrap items-center justify-between gap-x-6 gap-y-3 px-(--gutter) py-5 text-xs text-text-tertiary">
          <p>
            © {site.copyrightSince} {site.name}
          </p>
          <p>Designed, built and deployed by me, on my own server.</p>
        </div>
      </div>
    </footer>
  );
}

function ProfileIcon({ kind }: { kind: ProfileKey }) {
  const common = { className: "size-6", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (kind) {
    case "github":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.06c.53-1 1.84-2.06 3.78-2.06 4.04 0 4.79 2.66 4.79 6.12V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4V9.5Z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.18-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
        </svg>
      );
    case "hashnode":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M3.5 9.5 9.5 3.5a3.5 3.5 0 0 1 5 0l6 6a3.5 3.5 0 0 1 0 5l-6 6a3.5 3.5 0 0 1-5 0l-6-6a3.5 3.5 0 0 1 0-5Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
