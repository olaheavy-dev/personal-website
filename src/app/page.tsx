import { Hero } from "@/components/home/Hero";
import { JourneyStations } from "@/components/home/JourneyStations";
import { LogoRail } from "@/components/logos/LogoRail";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <LogoRail />
      <JourneyStations />
    </main>
  );
}
