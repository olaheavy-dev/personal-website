import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { gatePage } from "@/lib/flags/gate";

export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.writing");
  return { title: "Writing" };
}

export default async function WritingPage() {
  await gatePage("page.writing");
  return (
    <main id="main">
      <ComingSoon
        title="Notes from building in production"
        line="Posts from my Hashnode publication will appear here, on evaluations, RAG, and getting AI features past the demo."
      />
    </main>
  );
}
