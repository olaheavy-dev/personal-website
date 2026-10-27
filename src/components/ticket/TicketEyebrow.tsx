import type { StopEyebrow } from "@/lib/home/selected-stops";

// The two lines of a work ticket's eyebrow: the role (wraps between words) over its meta line
// ("2024 to now" or "via Deimos", kept on one line). Real spaces only, so copying the text is
// honest. A screen reader gets one phrase: "Backend Software Engineer, 2024 to now".
export function TicketEyebrow({ role, meta }: StopEyebrow) {
  return (
    <>
      {role ? (
        <>
          <span className="block">{role}</span>
          <span className="sr-only">, </span>
        </>
      ) : null}
      <span className="block whitespace-nowrap">{meta}</span>
    </>
  );
}
