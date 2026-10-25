import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { gatePage } from "@/lib/flags/gate";

// Gated twice on purpose (decision 0018): generateMetadata keeps a hidden page's own
// title out of the 404, and the page body renders the 404 itself.
export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.work");
  return { title: "Work" };
}

export default async function WorkPage() {
  await gatePage("page.work");
  return (
    <main id="main">
      <ComingSoon
        title="The full route, stop by stop"
        line="Case studies from HBK, Optty, Access Bank and Foresight are on their way, with the architecture, the trade-offs and sourced results. Until then, the home page has the short version."
      />
    </main>
  );
}
