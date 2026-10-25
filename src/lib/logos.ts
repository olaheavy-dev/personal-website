// The logo rail on Home (#9). Order is newest first, as on the route. The three Deimos
// clients sit together under "via Deimos". Each logo is a file in public/logos/ (sources in
// docs/references/logos.md), drawn through a CSS mask in one token colour.
//
// `aspect` is the file's viewBox width over height. `nudge` is a hand tuned correction
// (0.85 to 1.15) applied on top of equal visual area, so a heavy mark and a light one
// look the same size. The same two numbers, and the file, live in src/styles/logo-rail.css
// (a style attribute would break the strict style policy); logos.test.ts keeps them equal.

export type LogoSlug =
  "hbk" | "mukuru" | "ulesson" | "optty" | "stanbic-ibtc" | "access-bank" | "galooli" | "deimos";

export interface Logo {
  /** Matches the stop slug in the database, except "deimos", which is an agency. */
  slug: LogoSlug;
  /** The company's name, read out by screen readers. */
  name: string;
  /** The file in public/logos/ that the mask uses. */
  file: string;
  /** viewBox width divided by height. */
  aspect: number;
  /** Optical correction on top of equal area. */
  nudge: number;
}

export const NUDGE_MIN = 0.85;
export const NUDGE_MAX = 1.15;

export const deimos: Logo = {
  slug: "deimos",
  name: "Deimos",
  file: "deimos.svg",
  aspect: 117 / 17,
  nudge: 1,
};

const hbk: Logo = { slug: "hbk", name: "HBK", file: "hbk.svg", aspect: 134 / 46, nudge: 0.95 };
const mukuru: Logo = {
  slug: "mukuru",
  name: "Mukuru",
  file: "mukuru.svg",
  aspect: 978.76 / 306.5,
  nudge: 1.1,
};
const ulesson: Logo = {
  slug: "ulesson",
  name: "uLesson",
  file: "ulesson-mono.svg",
  aspect: 148 / 25,
  nudge: 1,
};
const optty: Logo = { slug: "optty", name: "Optty", file: "optty.svg", aspect: 500 / 187.05, nudge: 0.88 };
const stanbic: Logo = {
  slug: "stanbic-ibtc",
  name: "Stanbic IBTC",
  file: "stanbic-ibtc-mono.svg",
  aspect: 202 / 55,
  nudge: 1.15,
};
const access: Logo = {
  slug: "access-bank",
  name: "Access Bank",
  file: "access-bank.svg",
  aspect: 240.0006 / 58.568,
  nudge: 1.12,
};
const galooli: Logo = {
  slug: "galooli",
  name: "Galooli",
  file: "galooli.svg",
  aspect: 1200 / 366,
  nudge: 1.15,
};

export type RailItem =
  { kind: "logo"; logo: Logo } | { kind: "group"; label: string; via: Logo; logos: Logo[] };

export const railItems: RailItem[] = [
  { kind: "logo", logo: hbk },
  { kind: "group", label: "via Deimos", via: deimos, logos: [mukuru, ulesson, optty] },
  { kind: "logo", logo: stanbic },
  { kind: "logo", logo: access },
  { kind: "logo", logo: galooli },
];

/** Every logo the rail draws, in order, with the Deimos mark last. */
export const allLogos: Logo[] = [
  ...railItems.flatMap((item) => (item.kind === "logo" ? [item.logo] : item.logos)),
  deimos,
];
