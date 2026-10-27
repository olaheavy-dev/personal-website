import { workCopy } from "@/lib/work/copy";

// Shown when the stops could not be read: one calm sentence and the way to the highlights. The
// page still answers 200 (the header stays, the list is replaced). Server component.
export function WorkUnavailable() {
  const { before, link, after, href } = workCopy.failure;
  return (
    <section className="mx-auto w-full max-w-wide px-(--gutter)" data-work-unavailable="">
      <p className="max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">
        {before}
        <a
          href={href}
          className="font-medium text-lilac-text underline decoration-1 underline-offset-4 hover:no-underline"
        >
          {link}
        </a>
        {after}
      </p>
    </section>
  );
}
