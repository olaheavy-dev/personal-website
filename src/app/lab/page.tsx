import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { gatePage } from "@/lib/flags/gate";

export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.lab");
  return { title: "Lab" };
}

export default async function LabPage() {
  await gatePage("page.lab");
  return (
    <main id="main">
      <ComingSoon
        title="Things I build to learn"
        line="Foresight, FastPilot and HomeScout are coming here with demos, screenshots and what each one taught me. Most of them shipped."
      />
    </main>
  );
}
