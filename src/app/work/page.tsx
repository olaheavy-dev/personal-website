import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <main id="main">
      <ComingSoon
        title="The full route, stop by stop"
        line="Case studies from HBK, Optty, Access Bank and Foresight are on their way, with the architecture, the trade-offs and sourced results. Until then, the home page has the short version."
      />
    </main>
  );
}
