import type { StopEyebrow } from "@/lib/stops/eyebrow";

// The two lines of a work ticket's eyebrow: the role (wraps between words) over its meta line
// ("2024 to now" or "via Deimos", kept on one line). Real spaces only, so copying the text is
// honest. A screen reader gets one phrase: "Backend Software Engineer, 2024 to now".
//
// `reserveFrom` keeps two lines of height from that breakpoint, so a ticket whose eyebrow is one
// line ("via Deimos") starts its title level with a neighbour whose eyebrow is two (role over
// years). Use it only where tickets share a row. The 2lh assumes the role fits on one line.
const reserve = { md: "block md:min-h-[2lh]", lg: "block lg:min-h-[2lh]" } as const;

export function TicketEyebrow({
  role,
  meta,
  reserveFrom,
}: StopEyebrow & { reserveFrom?: keyof typeof reserve }) {
  return (
    <span className={reserveFrom ? reserve[reserveFrom] : undefined}>
      {role ? (
        <>
          <span className="block">{role}</span>
          <span className="sr-only">, </span>
        </>
      ) : null}
      <span className="block whitespace-nowrap">{meta}</span>
    </span>
  );
}
