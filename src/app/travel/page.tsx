import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return (
    <main id="main">
      <ComingSoon
        title="The route on a globe"
        line="A globe of the places I have lived and travelled, from Lagos to the UK and beyond, with photos from each stop."
      />
    </main>
  );
}
