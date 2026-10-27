import type { StopEyebrow } from "@/lib/home/selected-stops";

// The two lines of a work ticket's eyebrow: the role (wraps between words) over its meta line
// ("via Deimos · 2022 to 2024", kept on one line). Real spaces only, so copying the text is
// honest. A screen reader gets one phrase: "Senior Software Engineer, via Deimos · 2022 to 2024".
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
