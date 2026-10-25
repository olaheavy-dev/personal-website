"use client";

import { useEffect, useId, useState } from "react";
import { site } from "@/lib/site";

const formatOptions = {
  timeZone: site.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

function ukTime() {
  return new Intl.DateTimeFormat("en-GB", formatOptions).format(new Date());
}

export function AvailabilityChip() {
  const id = useId();
  // Server HTML carries a placeholder; the inline script fills the real time
  // before first paint, and the effect keeps it ticking after hydration.
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(ukTime());
    tick();
    const timer = window.setInterval(tick, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const fill = `(function(){var el=document.getElementById(${JSON.stringify(id)});if(el)el.textContent=new Intl.DateTimeFormat("en-GB",${JSON.stringify(formatOptions)}).format(new Date())})()`;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
      <span className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-elevated px-3 py-1.5 font-medium text-text-primary">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-live" />
        </span>
        {site.availability}
      </span>
      <span className="label-mono text-text-tertiary">
        {site.timeZoneLabel}{" "}
        <time id={id} data-visual-mask suppressHydrationWarning className="text-text-secondary tabular-nums">
          {time ?? "--:--"}
        </time>
      </span>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: fill }}
      />
    </p>
  );
}
