import { site } from "@/lib/site";
import { NextStopBand } from "./NextStopBand";

// The footer is the What's next band (the invitation to start the visitor's own route), then one
// slim line. The header already carries the name and the sections, so the footer doesn't
// repeat them.
export function Footer() {
  return (
    <footer className="mt-(--section-gap)">
      <NextStopBand />

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
