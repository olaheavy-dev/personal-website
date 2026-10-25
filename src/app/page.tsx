import { Hero } from "@/components/home/Hero";
import { JourneyStations } from "@/components/home/JourneyStations";
import { SelectedStops } from "@/components/home/SelectedStops";
import { LogoRail } from "@/components/logos/LogoRail";

export default function Home() {
  return (
    <main id="main" className="flex flex-col gap-(--section-gap)">
      <Hero />
      <LogoRail />
      <JourneyStations />
      <SelectedStops />
    </main>
  );
}
