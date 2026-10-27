import { LabMiniCard } from "@/components/home/LabMiniCard";
import { SectionLabel } from "@/components/home/SectionLabel";
import type { LabMiniCardModel } from "@/lib/home/two-up";
import { workCopy } from "@/lib/work/copy";

// The band under the Work list: the Foresight card and, while the Lab page is visible, a link
// to it. The page leaves this out entirely (no gap) when the model has no lab. Server component.
export function LabCrossLink({ card, moreLink }: { card: LabMiniCardModel; moreLink: "/lab" | null }) {
  return (
    <section
      id="work-lab"
      aria-labelledby="work-lab-title"
      className="mx-auto w-full max-w-wide px-(--gutter)"
    >
      <SectionLabel id="work-lab-title">{workCopy.lab.heading}</SectionLabel>
      <p className="max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">
        {workCopy.lab.line}
      </p>
      <div className="mt-6 max-w-(--ticket-max-width) md:max-w-md">
        <LabMiniCard card={card} />
      </div>
      {moreLink ? (
        <p className="mt-4">
          <a
            href={moreLink}
            className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-lilac-text"
          >
            <span className="underline decoration-1 underline-offset-4 group-hover:no-underline">
              See the whole lab
            </span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
      ) : null}
    </section>
  );
}
