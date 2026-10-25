import type { ReactNode, Ref } from "react";

// The shared frame for system pages (the 404 and the error page): a status
// eyebrow, the page's one h1, a lead and an actions slot. It renders the page's
// <main id="main"> so the skip link always has somewhere to go.
export interface StatusScreenProps {
  eyebrow: string;
  title: string;
  lead: string;
  /** Buttons, links or a route: anything the visitor can do next. */
  actions?: ReactNode;
  /** Gives the heading a ref and makes it focusable by script, so an error can move focus to it. */
  headingRef?: Ref<HTMLHeadingElement>;
  children?: ReactNode;
}

export function StatusScreen({ eyebrow, title, lead, actions, headingRef, children }: StatusScreenProps) {
  return (
    <main id="main">
      <section
        aria-labelledby="status-title"
        className="mx-auto w-full max-w-wide px-(--gutter) pt-10 pb-8 md:pt-16"
      >
        <p className="label-mono inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-elevated px-3 py-1.5 text-text-secondary">
          <span className="size-2 rounded-full bg-lilac" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1
          id="status-title"
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          // Focused by script after an error. A heading is not something to operate, so the
          // site's keyboard ring (a box shadow around the whole block) would only be noise.
          className="mt-6 max-w-(--max-width-content) text-display-lg leading-display focus-visible:rounded-none focus-visible:shadow-none"
        >
          {title}
        </h1>
        <p className="mt-5 max-w-(--max-width-lead) text-md leading-relaxed text-text-secondary">{lead}</p>
        {actions && <div className="mt-8">{actions}</div>}
        {children}
      </section>
    </main>
  );
}
