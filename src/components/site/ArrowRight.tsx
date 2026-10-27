// A right arrow drawn as an SVG, for links that point onward. The text arrow (U+2192) is not in Geist,
// so it came from whichever fallback font the device had and looked different on each platform. This
// one is the same everywhere, is sized in em so it follows the text, takes the text colour, and is
// hidden from assistive technology (the link's name is its text).
export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`inline-block size-[1em] shrink-0 align-[-0.125em] ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}
