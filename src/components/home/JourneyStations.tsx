import { SectionLabel } from "@/components/home/SectionLabel";
import { PlaneVehicle } from "@/components/route/PaperPlane";
import { Route } from "@/components/route/Route";
import { RoutePin } from "@/components/route/RoutePin";

// Idea → Design → Build → Ship → Scale, drawn as a Route. In the "Home page
// complete" task each station links to evidence in a case study.
const stations = [
  { name: "Idea", note: "Understand the problem with the people who face it." },
  { name: "Design", note: "Shape the experience through flows, prototypes and usability testing." },
  { name: "Build", note: "Full-stack engineering with human-centred AI built in." },
  { name: "Ship", note: "Launch with automated delivery, evaluations and guardrails." },
  {
    name: "Scale",
    note: "Improve quality, reliability and cost through user feedback and continuous evaluation.",
  },
] as const;

export function JourneyStations() {
  return (
    <section id="journey" aria-labelledby="journey-title" className="mx-auto w-full max-w-wide px-(--gutter)">
      <SectionLabel id="journey-title">The route, every time</SectionLabel>
      <Route
        variant={{ base: "vertical", md: "horizontal" }}
        className="mt-6 [--route-gap:var(--space-5)] [--route-pin-offset:var(--space-1)] md:[--route-gap:var(--space-4)] md:[--route-pin-offset:0px]"
      >
        <ol className="grid gap-(--route-gap) md:grid-cols-5">
          {stations.map((station, index) => (
            <li key={station.name} className="relative flex gap-4 md:flex-col md:gap-3">
              <RoutePin
                id={station.name.toLowerCase()}
                index={index}
                tone={index === 0 ? "start" : index === stations.length - 1 ? "end" : "default"}
                vehicle={index === stations.length - 2 ? <PlaneVehicle /> : undefined}
              />
              <div>
                <p className="font-display text-lg tracking-tight">{station.name}</p>
                <p className="mt-1 max-w-(--max-width-caption) text-sm text-text-secondary">{station.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </Route>
    </section>
  );
}
