import type { StopEyebrow } from "@/lib/stops/eyebrow";

// The hero's two tickets are static (the hero must not wait for the database), so their
// labels live here once. scripts/check-fake-content.test.ts proves they match what stopEyebrow (src/lib/stops/eyebrow.ts)
// builds from the seeded HBK and Galooli rows, so they cannot drift from the data.

/** The front ticket, HBK: role over years, as on the work tickets. */
export const heroFrontEyebrow: StopEyebrow = {
  role: "Backend Software Engineer",
  meta: "2024 to now",
};

/** The ticket peeking behind: one complete line, because only its top edge shows. */
export const heroPeekEyebrow = "2016 to 2018 \u00b7 Galooli";
