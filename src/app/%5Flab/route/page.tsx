// Developer only demo of the Route component at /_lab/route. A folder named
// `%5Flab` serves an underscore URL (a plain `_lab` folder is private and not
// routable). Off unless LAB_PAGES=1; never in nav, the sitemap or search.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlaneVehicle } from "@/components/route/PaperPlane";
import { Route } from "@/components/route/Route";
import { RoutePin } from "@/components/route/RoutePin";
import { ParkedVehicle, VehicleSprites } from "@/components/route/Vehicles";
import { labPagesEnabled } from "@/lib/lab-pages";

export const metadata: Metadata = { title: "Route lab", robots: { index: false, follow: false } };

// Stop names and numbers as in the information architecture naming table.
const stops = [
  { slug: "galooli", label: "Stop 01", name: "Galooli" },
  { slug: "access-bank", label: "Stop 02", name: "Access Bank" },
  { slug: "stanbic-ibtc", label: "Stop 03", name: "Stanbic IBTC" },
  { slug: "optty", label: "Stop 04", name: "Optty" },
  { slug: "ulesson", label: "Stop 05", name: "uLesson" },
  { slug: "mukuru", label: "Stop 06", name: "Mukuru" },
  { slug: "hbk", label: "Stop 07", name: "HBK · Now" },
] as const;
const heights = ["h-16", "h-32", "h-20", "h-40", "h-16", "h-28", "h-20"] as const;
// The Work route's vehicles, on a small made up route (newest first, like /work).
const vehicleStops = [
  { id: "lab-london", name: "London stop", years: "2024 to now", park: "bus" },
  { id: "lab-lagos-b", name: "Lagos stop, newer", years: "2020 to 2022", park: "danfo" },
  { id: "lab-lagos-a", name: "Lagos stop, older", years: "2018 to 2020", park: "danfo" },
] as const;
const steps = ["Idea", "Design", "Build", "Ship", "Scale"] as const;

function toneFor(index: number, length: number) {
  return index === 0 ? "start" : index === length - 1 ? "end" : "default";
}

async function Lab() {
  await connection();
  if (!labPagesEnabled()) notFound();
  return (
    <main id="main" className="mx-auto w-full max-w-wide px-(--gutter) py-8">
      <h1 className="font-display text-3xl tracking-tight">Route lab</h1>
      <p className="mt-2 text-text-secondary">Developer demo of the Route component. Not part of the site.</p>

      <section aria-labelledby="lab-vertical" className="mt-8" data-testid="lab-vertical">
        <h2 id="lab-vertical" className="label-mono text-text-tertiary">
          Vertical, drawn progressively
        </h2>
        <Route variant="vertical" draw="progressive" className="mt-6 [--route-gap:var(--space-6)]">
          <ol className="grid gap-(--route-gap)">
            {stops.map((stop, index) => (
              <li key={stop.slug} className="relative flex gap-4">
                <RoutePin
                  id={stop.slug}
                  index={index}
                  tone={index === stops.length - 1 ? "current" : toneFor(index, stops.length)}
                  last={index === stops.length - 1}
                />
                <div className={heights[index]}>
                  <p className="label-mono text-text-tertiary">{stop.label}</p>
                  <p className="font-display text-lg tracking-tight">{stop.name}</p>
                </div>
              </li>
            ))}
          </ol>
        </Route>
      </section>

      <section aria-labelledby="lab-horizontal" className="mt-16" data-testid="lab-horizontal">
        <h2 id="lab-horizontal" className="label-mono text-text-tertiary">
          Vertical on phones, horizontal from md, plane at Scale
        </h2>
        <Route
          variant={{ base: "vertical", md: "horizontal" }}
          className="mt-6 [--route-gap:var(--space-5)] md:[--route-gap:var(--space-4)]"
        >
          <ol className="grid gap-(--route-gap) md:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step} className="relative flex gap-4 md:flex-col md:gap-3">
                <RoutePin
                  id={step.toLowerCase()}
                  index={index}
                  tone={toneFor(index, steps.length)}
                  vehicle={index === steps.length - 2 ? <PlaneVehicle /> : undefined}
                />
                <p className="font-display text-lg tracking-tight">{step}</p>
              </li>
            ))}
          </ol>
        </Route>
      </section>

      <section aria-labelledby="lab-vehicles" className="mt-16" data-testid="lab-vehicles">
        <h2 id="lab-vehicles" className="label-mono text-text-tertiary">
          Vehicles: the danfo follows the latest Lagos pin reached, the plane rides the leg to London, the bus
          waits there
        </h2>
        <VehicleSprites />
        <Route
          variant="vertical"
          draw="progressive"
          className="mt-6 [--route-gap:var(--space-9)] [--route-rail-gap:var(--space-3)]"
        >
          <ol className="grid gap-(--route-gap)">
            {vehicleStops.map((stop, index) => (
              <li
                key={stop.id}
                className="relative grid grid-cols-[var(--route-pin-size)_minmax(0,1fr)] gap-x-(--route-rail-gap)"
              >
                <RoutePin
                  id={stop.id}
                  index={index}
                  tone={index === 0 ? "end" : index === vehicleStops.length - 1 ? "start" : "default"}
                  leg={index < vehicleStops.length - 1}
                  park={stop.park}
                  vehicle={index === 0 ? <PlaneVehicle /> : undefined}
                  vehicleDirection="up"
                />
                <div className="relative min-w-0 self-start pt-0.5">
                  <ParkedVehicle
                    kind={stop.park}
                    at={stop.id}
                    home={index === 1}
                    ring={index === 0 ? "end" : index === vehicleStops.length - 1 ? "start" : undefined}
                  />
                  <p className="label-mono text-text-tertiary">{stop.years}</p>
                  <p className="text-sm font-semibold">{stop.name}</p>
                </div>
              </li>
            ))}
          </ol>
        </Route>
      </section>

      <section aria-labelledby="lab-inline" className="mt-16" data-testid="lab-inline">
        <h2 id="lab-inline" className="label-mono text-text-tertiary">
          Inline, inside a sentence
        </h2>
        <p className="mt-6 text-lg">
          From idea{" "}
          <Route variant="inline" className="align-middle [--route-gap:var(--space-7)]">
            <span className="relative inline-flex">
              <RoutePin id="inline-start" tone="start" />
            </span>
            <span className="relative inline-flex">
              <RoutePin id="inline-end" tone="end" />
            </span>
          </Route>{" "}
          to production.
        </p>
      </section>

      <section aria-labelledby="lab-static" className="mt-16" data-testid="lab-static">
        <h2 id="lab-static" className="label-mono text-text-tertiary">
          Static, always finished
        </h2>
        <Route variant="vertical" draw="static" className="mt-6 [--route-gap:var(--space-5)]">
          <ol className="grid gap-(--route-gap)">
            {["First", "Second", "Third"].map((name, index, all) => (
              <li key={name} className="relative flex gap-4">
                <RoutePin
                  id={`static-${name.toLowerCase()}`}
                  index={index}
                  tone={toneFor(index, all.length)}
                />
                <p className="font-display text-lg tracking-tight">{name}</p>
              </li>
            ))}
          </ol>
        </Route>
      </section>
    </main>
  );
}

export default function RouteLabPage() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
