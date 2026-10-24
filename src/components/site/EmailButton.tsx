import { site } from "@/lib/site";

// Primary CTA. Copy-to-clipboard + toast arrives with the Toast component in
// the "Floating pill nav + footer" task; for now it is a plain mailto link.
export function EmailButton({ size = "md" }: { size?: "md" | "lg" }) {
  const padding = size === "lg" ? "px-6 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <a
      href={`mailto:${site.email}`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-primary font-medium text-text-inverse transition-colors duration-150 hover:bg-accent-primary-hover active:bg-accent-primary-active ${padding}`}
    >
      Email me
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
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </a>
  );
}
