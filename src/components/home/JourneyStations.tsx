// Idea → Design → Build → Ship → Scale. Static in the hero slice; in the
// "Home page complete" task each station links to evidence in a case study.
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
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="mx-auto w-full max-w-wide px-(--gutter) pt-8"
    >
      <h2 id="journey-title" className="label-mono text-text-tertiary">
        The route, every time
      </h2>
      <ol className="relative mt-6 grid gap-6 md:grid-cols-5 md:gap-4">
        {/* Dotted connector: vertical on mobile, horizontal from md */}
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-[calc(var(--route-pin-size)/2-1px)] border-l-2 border-dotted border-route-line md:top-[calc(var(--route-pin-size)/2-1px)] md:right-3 md:bottom-auto md:left-3 md:border-t-2 md:border-l-0"
        />
        {stations.map((station, index) => (
          <li key={station.name} className="relative flex gap-4 md:flex-col md:gap-3">
            <span
              aria-hidden="true"
              className={`relative z-10 mt-0.5 size-(--route-pin-size) shrink-0 rounded-full border-2 border-border-strong md:mt-0 ${
                index === stations.length - 1 ? "bg-route-pin" : index === 0 ? "bg-lilac" : "bg-bg-primary"
              }`}
            />
            <div>
              <p className="font-display text-lg tracking-tight">{station.name}</p>
              <p className="mt-1 max-w-(--max-width-caption) text-sm text-text-secondary">{station.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
