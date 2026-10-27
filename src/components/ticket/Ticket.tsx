import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "react";

// The site's signature card: a notched ticket with an optional tear-off stub.
// The shape lives in globals.css (".ticket"); this component lays out the slots.
// Server component: no state, no client JavaScript.

export type TicketLayout = "stacked" | "pass";
export type TicketSize = "large" | "compact" | "mini";
export type TicketTone = "paper" | "lilac";
export type TicketTilt = "none" | "front" | "back";

type TicketBaseProps = Omit<HTMLAttributes<HTMLElement>, "title" | "children"> & {
  /** "stacked": stub below the body. "pass": stub on the right from md, below on phones. */
  layout?: TicketLayout;
  /** large: home and footer. compact: Work list. mini: About career route (one line, no stub). */
  size?: TicketSize;
  tone?: TicketTone;
  tilt?: TicketTilt;
  /** Wrapper element; headings keep the page outline through `headingLevel`. */
  as?: "article" | "div";
  headingLevel?: 2 | 3 | 4;
  /** Mono label above the title: a string, or a `TicketEyebrow` for a role over its years. */
  eyebrow?: ReactNode;
  /** Company pill, shown opposite the eyebrow. */
  badge?: ReactNode;
  /** Id for the title element, so a surrounding region can be named by it. */
  titleId?: string;
  /** Half notches on the sides of a ticket that has no stub (the peeking ticket behind the hero). */
  notches?: "none" | "side";
  /** Body content under the title. */
  children?: ReactNode;
  /** Chips row (for example MetricChips) under the body content. */
  chips?: ReactNode;
  /** Tear-off stub content. Ignored for the mini size. */
  stub?: ReactNode;
  /** Replaces the body's padding classes, for example on a ticket that only peeks out. */
  bodyPadding?: string;
};

// `href` turns the title into the link, so a ticket with an href must have a title.
export type TicketProps = TicketBaseProps &
  ({ href?: undefined; title?: ReactNode } | { href: string; title: ReactNode });

const defaultBodyPadding: Record<TicketLayout, Record<TicketSize, string>> = {
  stacked: {
    large: "px-6 pt-5 pb-5",
    compact: "px-5 pt-4 pb-4",
    mini: "flex flex-wrap items-baseline gap-x-3 px-4 py-3",
  },
  pass: {
    large: "px-6 pt-8 pb-8 md:px-10 md:pt-10",
    compact: "px-5 pt-6 pb-6 md:px-8 md:pt-8",
    mini: "flex flex-wrap items-baseline gap-x-3 px-4 py-3",
  },
};

const stubPadding: Record<TicketLayout, string> = {
  stacked: "px-6 pt-4 pb-5",
  pass: "flex flex-col gap-6 px-6 py-6 md:justify-between md:px-7 md:py-10",
};

const titleStyle: Record<TicketLayout, Record<TicketSize, string>> = {
  stacked: {
    large: "mt-4 font-display text-display-sm leading-snug tracking-tight",
    compact: "mt-3 font-display text-lg leading-snug tracking-tight",
    mini: "font-display text-base leading-snug tracking-tight",
  },
  pass: {
    large: "mt-3 text-display-lg leading-display",
    compact: "mt-3 font-display text-lg leading-snug tracking-tight",
    mini: "font-display text-base leading-snug tracking-tight",
  },
};

export function Ticket({
  layout = "stacked",
  size = "large",
  tone = "paper",
  tilt = "none",
  as: Wrapper = "article",
  headingLevel = 2,
  eyebrow,
  badge,
  title,
  titleId,
  notches = "none",
  href,
  children,
  chips,
  stub,
  bodyPadding: bodyPaddingOverride,
  className = "",
  ...rest
}: TicketProps) {
  const generatedId = useId();
  const headingId = titleId ?? generatedId;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const hasStub = size !== "mini" && stub != null;
  // Only an article is a landmark-like element that can carry a name; a plain div must not.
  const labelledBy =
    Wrapper === "article" && title != null && rest["aria-label"] == null ? headingId : undefined;

  return (
    <Wrapper
      {...rest}
      aria-labelledby={rest["aria-labelledby"] ?? labelledBy}
      className={`ticket ${className}`.trim()}
      data-layout={layout}
      data-size={size}
      data-tone={tone}
      data-tilt={tilt === "none" ? undefined : tilt}
      data-stub={hasStub ? "" : undefined}
      data-linked={href ? "" : undefined}
      data-notches={notches === "none" ? undefined : notches}
    >
      <div className={`ticket-body ${bodyPaddingOverride ?? defaultBodyPadding[layout][size]}`}>
        {eyebrow != null || badge != null ? (
          <div className="flex items-center justify-between gap-3">
            {eyebrow != null ? (
              <p className={`label-mono ${tone === "paper" ? "text-text-tertiary" : ""}`.trim()}>{eyebrow}</p>
            ) : (
              <span />
            )}
            {badge != null ? (
              <p className="label-mono rounded-full bg-teal-soft px-2.5 py-1 text-teal-text">{badge}</p>
            ) : null}
          </div>
        ) : null}
        {title != null ? (
          <Heading id={headingId} className={titleStyle[layout][size]}>
            {href ? (
              <a href={href} className="ticket-link">
                {title}
              </a>
            ) : (
              title
            )}
          </Heading>
        ) : null}
        {children}
        {chips != null ? <div className="mt-4">{chips}</div> : null}
      </div>
      {hasStub ? <div className={`ticket-stub ${stubPadding[layout]}`}>{stub}</div> : null}
    </Wrapper>
  );
}
