// The 404. Static and prerendered, so it costs the same as any other page. Next
// adds noindex and answers status 404 for an unmatched URL. It never repeats the
// requested path, and says nothing about pages that exist but are switched off
// (decision 0006). A hidden page answers the same status and robots header as a mistyped
// address, with nothing of its own in it. It is not byte for byte the same: see decision 0018.
// src/proxy.ts renders every unknown address under one fixed path, so this page, which reads
// the flags and is rebuilt after each revalidation, never stores a visitor's URL.
import type { Metadata } from "next";
import { StatusScreen } from "@/components/system/StatusScreen";
import { WayBack } from "@/components/system/WayBack";
import { getFlags } from "@/lib/db/queries/flags";
import { visiblePages } from "@/lib/flags/registry";
import { getViewer } from "@/lib/flags/visibility";

export const metadata: Metadata = { title: "Wrong turn" };

export default async function NotFound() {
  // Work is offered as a way back only while Work is visible.
  const items = visiblePages(await getFlags(), await getViewer());
  return (
    <StatusScreen
      eyebrow="404 · Wrong turn"
      title="Looks like a wrong turn"
      lead="There's nothing at this address. The link may be mistyped, or the page may have moved. Here's the way back."
      actions={<WayBack items={items} />}
    />
  );
}
