import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Lab" };

export default function LabPage() {
  return (
    <main id="main">
      <ComingSoon
        title="Things I build to learn"
        line="Foresight, FastPilot and HomeScout are coming here with demos, screenshots and what each one taught me. Most of them shipped."
      />
    </main>
  );
}
