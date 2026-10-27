import type { Metadata } from "next";
import { WorkPageView } from "@/components/work/WorkPage";
import { getFlags } from "@/lib/db/queries/flags";
import { getLabProjects } from "@/lib/db/queries/lab";
import { getStops } from "@/lib/db/queries/stops";
import { gatePage } from "@/lib/flags/gate";
import { getViewer } from "@/lib/flags/visibility";
import { workCopy } from "@/lib/work/copy";
import { buildWorkRoute } from "@/lib/work/route";

// Gated twice on purpose (decision 0018): generateMetadata keeps a hidden page's own
// title out of the 404, and the page body renders the 404 itself.
export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.work");
  return {
    title: "Work",
    description: workCopy.metaDescription,
    alternates: { canonical: "/work" },
  };
}

export default async function WorkPage() {
  await gatePage("page.work");
  const [stops, labProjects, flags, viewer] = await Promise.all([
    getStops(),
    getLabProjects(),
    getFlags(),
    getViewer(),
  ]);
  return <WorkPageView model={buildWorkRoute(stops, labProjects, flags, viewer)} />;
}
