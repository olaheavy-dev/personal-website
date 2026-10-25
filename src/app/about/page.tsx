import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { gatePage } from "@/lib/flags/gate";

export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.about");
  return { title: "About" };
}

export default async function AboutPage() {
  await gatePage("page.about");
  return (
    <main id="main">
      <ComingSoon
        title="The longer story"
        line="How I went from Lagos to the UK, from IoT to banking, payments and production AI, and how I like to work."
      />
    </main>
  );
}
