import Link from "next/link";
import { EmailButton } from "./EmailButton";

// Shared placeholder for sections whose real page hasn't shipped. Each section
// task replaces its page (see src/lib/nav.ts).
export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <section
      aria-labelledby="coming-soon-title"
      className="mx-auto w-full max-w-wide px-(--gutter) pt-12 pb-8 md:pt-20"
    >
      <p className="label-mono inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-elevated px-3 py-1.5 text-text-secondary">
        <span className="size-2 rounded-full bg-lilac" aria-hidden="true" />
        Coming soon
      </p>
      <h1 id="coming-soon-title" className="mt-6 text-display-lg leading-display">
        {title}
      </h1>
      <p className="mt-5 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">{line}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 font-medium transition-colors duration-150 hover:bg-bg-secondary"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to the start
        </Link>
        <EmailButton size="lg" />
      </div>
    </section>
  );
}
