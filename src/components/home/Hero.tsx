import { site } from "@/lib/site";
import { EmailButton } from "@/components/site/EmailButton";
import { MiniRoute } from "@/components/route/MiniRoute";
import { AvailabilityChip } from "./AvailabilityChip";
import { HeroTickets } from "./HeroTickets";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid w-full max-w-wide gap-12 px-(--gutter) pt-10 pb-12 md:pt-14 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pb-16"
    >
      <div className="lg:col-span-8">
        <AvailabilityChip />

        <h1 id="hero-title" className="mt-6 md:mt-7">
          <span className="block text-display-xl leading-display">
            Hi, I&rsquo;m
            {/* eslint-disable-next-line @next/next/no-img-element -- 18KB pre-optimised asset, LCP-safe */}
            <img
              src="/images/sunkanmi-256.jpg"
              alt=""
              width={128}
              height={128}
              fetchPriority="high"
              className="mx-(--inline-portrait-gap) inline-block size-(--inline-portrait-size) rotate-(--inline-portrait-tilt) rounded-full border-(length:--inline-portrait-border) border-border-strong bg-bg-tertiary object-cover object-top align-(--inline-portrait-baseline)"
            />{" "}
            <span className="inline-block rotate-(--highlight-tilt) rounded-(--highlight-radius) bg-lilac px-(--highlight-pad-x) pb-(--highlight-pad-bottom) text-text-on-accent transition-transform duration-(--duration-normal) ease-bounce hover:rotate-0 motion-reduce:rotate-0">
              {site.firstName}
            </span>
          </span>
          <span className="mt-3 block text-display-md leading-(--line-height-display-sub) text-text-secondary md:mt-4">
            I take products from{" "}
            <span className="whitespace-nowrap">
              idea
              <MiniRoute />
            </span>{" "}
            to <span className="whitespace-nowrap text-text-primary">production,</span>{" "}
            <span className="text-text-primary">with AI built&nbsp;in.</span>
          </span>
        </h1>

        <p className="mt-5 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">
          Full-stack &amp; AI engineer in the UK. For ten years I&rsquo;ve shipped software where failure is
          expensive: banking, cross-border payments, edtech. Today at HBK I build a sensor-data analytics
          platform and the AI inside it: RAG, AI agents and the product engineers rely on. I design it, build
          it and keep it running.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <EmailButton size="lg" />
          <a
            href="#journey"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 font-medium transition-colors duration-150 hover:bg-bg-secondary"
          >
            See how I work
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
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>

      <div className="lg:col-span-4">
        <HeroTickets />
      </div>
    </section>
  );
}
