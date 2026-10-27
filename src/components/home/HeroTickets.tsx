import { Ticket } from "@/components/ticket/Ticket";

// Two stacked, slightly tilted tickets beside the hero: the current stop (HBK)
// in front, the previous one peeking behind. Built on the shared Ticket component.
// Copy follows the claims policy in .design/portfolio/DESIGN_BRIEF.md.
export function HeroTickets() {
  return (
    <div className="relative mx-auto w-full max-w-(--ticket-max-width) pt-10 pb-6 lg:mx-0 lg:ml-auto">
      {/* Previous stop, peeking behind */}
      <Ticket
        as="div"
        tone="lilac"
        tilt="back"
        notches="side"
        className="absolute inset-x-6 top-0"
        bodyPadding="px-5 pt-4 pb-16"
        eyebrow="Technical Support Engineer · 2016 to 2018"
        aria-hidden="true"
      />

      {/* Current stop */}
      <Ticket
        tilt="front"
        eyebrow="Backend Software Engineer · 2024 to now"
        badge="HBK"
        title="Advantage Insights"
        chips={
          <ul className="flex flex-wrap gap-1.5" aria-label="What I build here">
            {["Analytics platform", "AI agents", "RAG"].map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-border-primary px-2.5 py-1 text-xs font-medium"
              >
                {chip}
              </li>
            ))}
          </ul>
        }
        stub={
          <div className="flex flex-wrap items-center justify-between gap-x-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium whitespace-nowrap">
              <span className="size-2 rounded-full bg-live" aria-hidden="true" />
              Aiana live since 2025 R4
            </span>
            <a
              href="https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights"
              className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
              rel="noopener"
              target="_blank"
            >
              Release notes
              <span className="sr-only"> (HBK, opens in a new tab)</span>
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </div>
        }
      >
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Designing and building HBK&rsquo;s sensor-data analytics platform for test, durability and fatigue
          engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like
          Python code suggestions and file data analysis.
        </p>
      </Ticket>
    </div>
  );
}
