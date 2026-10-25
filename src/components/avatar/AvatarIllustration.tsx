// The avatar as a placeholder illustration with a pose. Until the drawn avatar
// lands (the art task, #33) every pose is the round portrait; "lost" adds a small
// route pin badge with a question mark. The props are the final contract, so the
// art task swaps the drawing with no layout change. Decorative: the heading beside
// it carries the meaning, so the image has no alt text.
export type AvatarPose = "wave" | "thinking" | "pointing" | "travelling" | "lost";

export interface AvatarIllustrationProps {
  pose: AvatarPose;
  size?: "pin" | "md" | "lg";
  className?: string;
}

// "lg" is smaller below the lg breakpoint, where it sits above the text instead of beside it.
// "pin" is the avatar standing in for a route pin (the 404), sized by --avatar-pin-size.
const sizeClass = { pin: "size-(--avatar-pin-size)", md: "size-28", lg: "size-24 lg:size-40" } as const;
const badgeClass = {
  pin: "size-6 text-sm",
  md: "size-9 text-lg",
  lg: "size-9 text-lg",
} as const;

export function AvatarIllustration({ pose, size = "md", className = "" }: AvatarIllustrationProps) {
  return (
    <span
      data-avatar=""
      data-pose={pose}
      aria-hidden="true"
      className={`relative block ${sizeClass[size]} ${className}`.trim()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 18KB pre-optimised asset, already cached by the header */}
      <img
        src="/images/sunkanmi-256.jpg"
        alt=""
        width={256}
        height={256}
        className="size-full rotate-(--inline-portrait-tilt) rounded-full border-(length:--inline-portrait-border) border-border-strong bg-bg-tertiary object-cover object-top"
      />
      {pose === "lost" && (
        <span
          data-avatar-badge=""
          className={`absolute -top-1 -right-1 grid ${badgeClass[size]} place-items-center rounded-full border-2 border-border-strong bg-lilac font-display leading-none text-text-on-accent`}
        >
          ?
        </span>
      )}
    </span>
  );
}
