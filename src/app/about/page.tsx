import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main id="main">
      <ComingSoon
        title="The longer story"
        line="How I went from Lagos to the UK, from IoT to banking, payments and production AI, and how I like to work."
      />
    </main>
  );
}
