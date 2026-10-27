import { PageHeader } from "@/components/site/PageHeader";
import { WorkRoute } from "@/components/work/WorkRoute";
import { WorkUnavailable } from "@/components/work/WorkUnavailable";
import { workCopy } from "@/lib/work/copy";
import type { WorkRouteModel } from "@/lib/work/route";

// The /work page from its model: header, then the list, or the failure line.
// A plain function of the model, so every state is a component test. Server component.
export function WorkPageView({ model }: { model: WorkRouteModel }) {
  return (
    <main id="main" className="flex flex-col gap-(--section-gap)">
      <PageHeader title={workCopy.h1} intro={workCopy.intro} />
      {model.unavailable ? <WorkUnavailable /> : <WorkRoute entries={model.entries} />}
    </main>
  );
}
