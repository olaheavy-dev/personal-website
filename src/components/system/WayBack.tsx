import Link from "next/link";
import { PlaneVehicle } from "@/components/route/PaperPlane";
import { Route } from "@/components/route/Route";
import { RoutePin } from "@/components/route/RoutePin";
import { wayBackLinks, type NavItem } from "@/lib/nav";

// The 404's way back: a Route from "You are here" to Home and, when it is in the
// navigation, Work. The paper plane rides the first leg, pointing the visitor
// back. Server rendered; the Route's own observer is the only client code.
export function WayBack({ items }: { items?: NavItem[] }) {
  const links = wayBackLinks(items);
  return (
    <Route
      variant={{ base: "vertical", md: "horizontal" }}
      className="[--route-gap:var(--space-5)] [--route-pin-offset:var(--space-1)] md:[--route-gap:var(--space-4)] md:[--route-pin-offset:0px]"
    >
      <ol
        aria-label="The way back"
        className={`grid gap-(--route-gap) md:max-w-3xl ${links.length > 1 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {/* min-h: with no note under it, the first leg on a phone would be too short to carry the plane. */}
        <li className="relative flex min-h-14 gap-4 md:min-h-0 md:flex-col md:gap-3">
          <RoutePin id="here" index={0} tone="current" vehicle={<PlaneVehicle />} />
          <div>
            <p className="font-display text-lg tracking-tight">You are here</p>
          </div>
        </li>
        {links.map((link, index) => (
          <li key={link.href} className="relative flex gap-4 md:flex-col md:gap-3">
            <RoutePin
              id={link.label.toLowerCase()}
              index={index + 1}
              tone={index === links.length - 1 ? "end" : "default"}
            />
            <Link
              href={link.href}
              className="-my-2 block min-h-11 rounded-lg py-2 text-left transition-colors duration-150 hover:text-text-secondary"
            >
              <span className="block font-display text-lg tracking-tight">{link.label}</span>
              <span className="mt-1 block max-w-(--max-width-caption) text-sm text-text-secondary">
                {link.note}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Route>
  );
}
