import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { JourneyStations } from "@/components/home/JourneyStations";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <JourneyStations />
      </main>
    </>
  );
}
