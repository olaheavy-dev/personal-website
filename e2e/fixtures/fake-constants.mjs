// Values shared by the fake Supabase server, the Playwright config and the specs. Kept in a
// file of their own, with no top level await and no import.meta, because Playwright loads
// config and specs as CommonJS and can only pull in modules that are plain exports.

export const fakePort = 54329;
export const fakeUrl = `http://127.0.0.1:${fakePort}`;
export const fakePublishableKey = "sb_publishable_e2e_fake_key_for_tests";

/** Today's flags: the home page and the five section pages are on. */
export const defaultFlags = Object.freeze({
  "page.home": "on",
  "page.work": "on",
  "page.lab": "on",
  "page.writing": "on",
  "page.travel": "on",
  "page.about": "on",
});
