import { Ticket } from "@/components/ticket/Ticket";
import { TicketEyebrow } from "@/components/ticket/TicketEyebrow";
import { heroFrontEyebrow, heroPeekEyebrow } from "@/lib/home/hero-tickets";

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
        eyebrow={heroPeekEyebrow}
        aria-hidden="true"
      />

      {/* Current stop */}
      <Ticket
        tilt="front"
        eyebrow={<TicketEyebrow {...heroFrontEyebrow} />}
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
          /* Always two rows. The status and the link fit one row or two depending on the font in use
              (the ticket is about 305 px wide, a few px short either way), so letting them wrap moved
              them, and the ticket, when a late web font replaced the fallback. */
          <div className="flex flex-col items-start text-sm">
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
        {/* Six lines is what it takes with the web font at nearly every width. Reserving them keeps the ticket
            from growing when a late font swap needs one line more than the fallback did. */}
        <p className="mt-2 min-h-[6lh] text-sm leading-relaxed text-text-secondary">
          Designing and building HBK&rsquo;s sensor-data analytics platform for test, durability and fatigue
          engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like
          Python code suggestions and file data analysis.
        </p>
      </Ticket>
    </div>
  );
}
