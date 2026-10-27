import Link from "next/link";
import { AvatarIllustration } from "@/components/avatar/AvatarIllustration";
import { PlaneVehicle } from "@/components/route/PaperPlane";
import { Route } from "@/components/route/Route";
import { RoutePin } from "@/components/route/RoutePin";
import { wayBackLinks, type NavItem } from "@/lib/nav";
import { ArrowRight } from "@/components/site/ArrowRight";

// The 404's way back: a Route that starts with the lost avatar as the "You are
// here" stop, then Home and, when it is in the navigation, Work. The paper plane
// leaves the avatar and rides the first leg towards Home. Server rendered; the
// Route's own observer is the only client code.
//
// The avatar is bigger than a pin, so it is drawn over a normal pin (RoutePin's
// `marker`) and the route's geometry stays as it is. --wb-delta is how far the
// avatar overhangs the pin on each side: the list is pushed in and down by it so the
// avatar lines up with the page edge, and every stop's text is pushed clear of it.
export function WayBack({ items }: { items: readonly NavItem[] }) {
  const links = wayBackLinks(items);
  return (
    <Route
      variant={{ base: "vertical", md: "horizontal" }}
      className="[--route-gap:var(--space-5)] [--route-pin-offset:var(--space-1)] md:[--route-gap:var(--space-4)] md:[--route-pin-offset:0px]"
    >
      <ol
        aria-label="The way back"
        className={`way-back ml-(--wb-delta) grid gap-(--route-gap) pt-(--wb-delta) md:max-w-content ${links.length > 1 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {/* min-h: leaves the first leg long enough to show the plane clear of both stops. */}
        <li className="relative flex min-h-20 gap-4 md:min-h-0 md:flex-col md:gap-3">
          <RoutePin
            id="here"
            index={0}
            tone="start"
            vehicle={<PlaneVehicle />}
            marker={<AvatarIllustration pose="lost" size="pin" />}
          />
          <p className="ps-(--wb-delta) font-display text-lg tracking-tight md:-ms-(--wb-delta) md:ps-0 md:pt-(--wb-delta)">
            You are here
          </p>
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
              className="group -mx-2 -my-2 block min-h-11 rounded-lg px-2 py-2 ps-[calc(var(--wb-delta)+var(--space-2))] text-left md:ps-2 md:pt-[calc(var(--wb-delta)+var(--space-2))]"
            >
              <span className="block font-display text-lg tracking-tight underline-offset-4 group-hover:underline group-focus-visible:underline">
                {link.label}
                <span
                  aria-hidden="true"
                  className="ml-1.5 inline-block no-underline motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:translate-x-1"
                >
                  <ArrowRight />
                </span>
              </span>
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
