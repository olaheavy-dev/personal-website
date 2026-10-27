import type { ReactNode } from "react";

// The top of an inner page: the page's one h1, an optional mono eyebrow above it, and an intro
// under it (information architecture, "PageHeader"). Server component.
export function PageHeader({
  title,
  intro,
  eyebrow,
}: {
  title: string;
  intro?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mx-auto w-full max-w-wide px-(--gutter) pt-12 md:pt-20">
      {eyebrow ? <p className="label-mono text-text-secondary">{eyebrow}</p> : null}
      <h1 className={eyebrow ? "mt-4 text-display-lg leading-display" : "text-display-lg leading-display"}>
        {title}
      </h1>
      {intro ? (
        <p className="mt-5 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">{intro}</p>
      ) : null}
    </header>
  );
}
