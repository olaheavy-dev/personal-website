// The 404. Static and prerendered, so it costs the same as any other page. Next
// adds noindex and answers status 404 for an unmatched URL. It never repeats the
// requested path, and says nothing about pages that exist but are switched off
// (decision 0006), so every hidden page looks exactly like a mistyped one.
import type { Metadata } from "next";
import { StatusScreen } from "@/components/system/StatusScreen";
import { WayBack } from "@/components/system/WayBack";

export const metadata: Metadata = { title: "Wrong turn" };

export default function NotFound() {
  return (
    <StatusScreen
      eyebrow="404 · Wrong turn"
      title="Looks like a wrong turn"
      lead="There's nothing at this address. The link may be mistyped, or the page may have moved. Here's the way back."
      actions={<WayBack />}
    />
  );
}
