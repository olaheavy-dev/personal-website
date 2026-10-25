import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { gatePage } from "@/lib/flags/gate";

export async function generateMetadata(): Promise<Metadata> {
  await gatePage("page.travel");
  return { title: "Travel" };
}

export default async function TravelPage() {
  await gatePage("page.travel");
  return (
    <main id="main">
      <ComingSoon
        title="The route on a globe"
        line="A globe of the places I have lived and travelled, from Lagos to the UK and beyond, with photos from each stop."
      />
    </main>
  );
}
