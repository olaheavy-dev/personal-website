import {
  toolLogoDir,
  toolkitGroups,
  toolkitNotices,
  type ToolkitGroup,
  type ToolkitIcon,
  type ToolkitTool,
} from "@/lib/toolkit";

// The Toolkit section of /work (#10): one large ticket (paper, outline, hard offset shadow, no
// stub) holding six groups, each a name and its tools as chips. A dashed tear line with a notch
// on each edge divides the groups; there is none after the last. The look lives in
// src/styles/toolkit.css. Server component: no state, no client JavaScript.
//
// From md it sits in the same two column grid as the timeline, after it: "Toolkit" is the rail
// label and the ticket is the right column. On phones the label sits above the ticket.
//
// Plates and icons are hidden from assistive technology (the chip's name is the text beside
// them). Each group is a heading and a list named by it. The chips are not links yet.

// Our own line icons, 24 px grid, drawn with a stroke in the plate's text colour.
const iconPaths: Record<ToolkitIcon, string> = {
  code: "M8 6 3 12l5 6M16 6l5 6-5 6",
  ai: "M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  data: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 11.6 3.3 3.3 0 0 0 7 18z",
  test: "M5 12.5l4.5 4.5L19 7.5",
  ship: "M4 12h14M13 6l6 6-6 6",
};

// A long dotted name (Microsoft.Extensions.AI.Evaluation) may break after a dot on a narrow phone,
// instead of mid word. Short names such as Next.js and .NET stay whole.
function breakable(name: string) {
  if (name.length < 20) return name;
  return name
    .split(".")
    .flatMap((part, index, all) => (index < all.length - 1 ? [part + ".", <wbr key={part} />] : [part]));
}

function Plate({ tool, group }: { tool: ToolkitTool; group: ToolkitGroup }) {
  const { plate } = tool;
  if (plate.kind === "logo") {
    return (
      <span
        className="toolkit-plate"
        data-plate="logo"
        data-wide={plate.wide ? "" : undefined}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a small static SVG from public/logos/tools, sized by CSS */}
        <img
          src={`${toolLogoDir}${plate.file}`}
          alt=""
          width={plate.wide ? 38 : 18}
          height={plate.wide ? 12 : 18}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }
  if (plate.kind === "abbr") {
    return (
      <span className="toolkit-plate label-mono" data-plate="abbr" data-tint={group.tint} aria-hidden="true">
        {plate.text}
      </span>
    );
  }
  return (
    <span className="toolkit-plate" data-plate="icon" data-tint={group.tint} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPaths[group.icon]} />
      </svg>
    </span>
  );
}

export function Toolkit() {
  return (
    <section
      aria-labelledby="toolkit-heading"
      data-toolkit=""
      className="mx-auto w-full max-w-wide px-(--gutter)"
    >
      <div className="grid gap-y-4 md:grid-cols-[var(--work-rail-width-md)_minmax(0,var(--work-ticket-max))] md:gap-x-6 lg:grid-cols-[var(--work-rail-width)_minmax(0,var(--work-ticket-max))] lg:gap-x-10">
        <h2 id="toolkit-heading" className="label-mono text-sm text-text-secondary md:pt-0.5">
          Toolkit
        </h2>
        <div className="min-w-0">
          <div className="toolkit-ticket">
            {toolkitGroups.map((group, index) => (
              <div key={group.id} className="toolkit-group" data-group={group.id}>
                {index > 0 ? (
                  <>
                    <span className="toolkit-notch" data-side="left" aria-hidden="true" />
                    <span className="toolkit-notch" data-side="right" aria-hidden="true" />
                  </>
                ) : null}
                <h3 id={`toolkit-${group.id}`} className="toolkit-group-name">
                  {group.name}
                </h3>
                <ul aria-labelledby={`toolkit-${group.id}`} className="toolkit-chips">
                  {group.tools.map((tool) => (
                    <li key={tool.name} className="toolkit-chip">
                      <Plate tool={tool} group={group} />
                      <span className="toolkit-chip-name">{breakable(tool.name)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-(--max-width-content) text-xs leading-relaxed text-text-tertiary">
            {toolkitNotices.join(" ")}
          </p>
        </div>
      </div>
    </section>
  );
}
