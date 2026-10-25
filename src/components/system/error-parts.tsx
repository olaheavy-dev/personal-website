// Pieces shared by the error page (ErrorScreen) and the global error page, which
// is built apart from it so its chunk stays small. One place for the copy and
// the button looks keeps the two from drifting.
export const errorCopy = {
  eyebrow: "Service interrupted",
  title: "This page hit a problem",
  lead: "Something broke while loading it. Trying again usually fixes it.",
  retry: "Try again",
  home: "Back to the start",
} as const;

export const referenceLine = (digest: string) => `Reference: ${digest}. Quote it if you email me.`;

export const primaryButton =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-6 py-3.5 text-base font-medium text-text-inverse transition-colors duration-150 hover:bg-accent-primary-hover active:bg-accent-primary-active";

export const secondaryButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 text-base font-medium transition-colors duration-150 hover:bg-bg-secondary";

// The same back arrow as the coming soon pages.
export function BackArrow() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
