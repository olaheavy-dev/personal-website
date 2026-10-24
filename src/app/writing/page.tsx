import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Writing" };

export default function WritingPage() {
  return (
    <main id="main">
      <ComingSoon
        title="Notes from building in production"
        line="Posts from my Hashnode publication will appear here, on evaluations, RAG, and getting AI features past the demo."
      />
    </main>
  );
}
