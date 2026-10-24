// Two stacked, slightly tilted tickets beside the hero: the current stop (HBK)
// in front, the previous one peeking behind. Uses the ticket utilities from
// globals.css; the full Ticket component arrives in the "Ticket component" task.
// Copy follows the claims policy in .design/portfolio/DESIGN_BRIEF.md.
export function HeroTickets() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem] pt-10 pb-6 lg:mx-0 lg:ml-auto">
      {/* Previous stop, peeking behind */}
      <div className="ticket-drop absolute inset-x-6 top-0 -rotate-[5deg]" aria-hidden="true">
        <div className="ticket bg-lilac px-5 pt-4 pb-16 text-text-on-accent">
          <p className="label-mono">Stop 02 · Optty · via Deimos</p>
        </div>
      </div>

      {/* Current stop */}
      <article className="ticket-drop group relative rotate-[2deg] transition-transform duration-[var(--duration-normal)] ease-out-expo hover:rotate-0 motion-reduce:rotate-0">
        <div className="ticket px-6 pt-5 pb-5 [--notch-y:calc(100%-5.6rem)]">
          <div className="flex items-center justify-between gap-3">
            <p className="label-mono text-text-tertiary">Stop 01 · Now</p>
            <p className="label-mono rounded-full bg-teal-soft px-2.5 py-1 text-teal-text">HBK</p>
          </div>
          <h2 className="mt-4 font-display text-display-sm leading-snug tracking-tight">
            Advantage Insights
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            HBK&rsquo;s sensor-data analytics platform for test and durability engineers&nbsp;&mdash; and the
            AI inside it, including Aiana, an assistant that answers with links back to the docs.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="What I build here">
            {["RAG", "AI agents", "Analytics platform"].map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-border-primary px-2.5 py-1 text-xs font-medium"
              >
                {chip}
              </li>
            ))}
          </ul>
          <div className="ticket-perforation -mx-6 mt-5" aria-hidden="true" />
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <span className="size-2 rounded-full bg-live" aria-hidden="true" />
              Aiana live since 2025 R4
            </span>
            <a
              href="https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights"
              className="inline-flex min-h-11 items-center gap-1 text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
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
        </div>
      </article>
    </div>
  );
}
