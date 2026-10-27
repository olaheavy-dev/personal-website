import type { StopEyebrow } from "@/lib/home/selected-stops";

// The two lines of a work ticket's eyebrow: the role (wraps between words) over its meta line
// ("2024 to now" or "via Deimos", kept on one line). Real spaces only, so copying the text is
// honest. A screen reader gets one phrase: "Backend Software Engineer, 2024 to now".
//
// `reserveLines` keeps two lines of height from 768 px, so a row of tickets whose eyebrows are one
// line ("via Deimos") and two lines (role over years) still starts their titles at the same height.
export function TicketEyebrow({
  role,
  meta,
  reserveLines = false,
}: StopEyebrow & { reserveLines?: boolean }) {
  return (
    <span className={reserveLines ? "block md:min-h-[2lh]" : undefined}>
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
