// How long a page waits for its script before showing routes finished. The route's
// undrawn state applies from first paint (so there is no finished then undrawn
// flash), which means a script that never loads would leave it undrawn for good.
// RouteObserver sets data-armed on mount; if the page has a route but none is armed
// by then, data-route-fallback on <html> switches the undrawn state off. Pages with
// no route never set it, so a later client navigation to a route still draws.
// Well above a normal hydration time.
const ROUTE_FALLBACK_MS = 3000;

/**
 * A deep link to a ticket (/work#galooli) lands on it open from the first layout. The :target
 * rule in globals.css cannot do that alone: a browser may paint before it resolves the fragment
 * (the HTML Standard leaves that timing to the browser, and Chrome on a slow CPU does), so the
 * ticket would open after that paint and push everything below it down (a layout shift). Runs in <head>, before the body exists,
 * and adds one rule for the stop the hash names. Only a slug is accepted (lowercase letters,
 * digits, single hyphens), so the hash cannot inject CSS. The rule ends at hydration, as the
 * :target one does, or at the first hash change. After a client navigation without a hash
 * change the style stays in <head>, inert, because every hydrated expander carries
 * data-hydrated. Written as a function so it can be tested; the script is its source text, so
 * the server and client copies may be minified differently (React does not compare them).
 * A future strict style-src (the admin policy in src/lib/security/headers.ts) would need the
 * script's nonce copied onto this style.
 */
export function openDeepLinkedTicket(): void {
  const match = /^#([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(window.location.hash);
  if (!match) return;
  const style = document.createElement("style");
  style.setAttribute("data-deep-link", "");
  style.textContent =
    'li[id="' + match[1] + '"] .ticket-expander:not([data-hydrated]){grid-template-rows:1fr;transition:none}';
  document.head.appendChild(style);
  // The rule is for the first layout only. Once the hash changes, :target decides again.
  window.addEventListener("hashchange", () => style.remove(), { once: true });
}

// Runs before first paint. Marks that JavaScript runs (data-js, which gates the
// route's undrawn state), arms the fallback above, applies a saved theme and opens a
// deep linked ticket (above). With no saved choice the stylesheet follows
// prefers-color-scheme, so there is nothing to set for the theme. Shared by the root
// layout and the global error page.
export const themeScript = `(function(){var h=document.documentElement;h.setAttribute("data-js","");setTimeout(function(){if(document.querySelector("[data-route]")&&!document.querySelector("[data-armed]"))h.setAttribute("data-route-fallback","")},${ROUTE_FALLBACK_MS});try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")h.setAttribute("data-theme",t)}catch(e){}})();(${openDeepLinkedTicket.toString()})()`;

/**
 * Applies the saved theme again. The global error page replaces the whole
 * document, and React does not run a script it inserts, so the attribute the
 * script set on the old <html> is gone. Call this in a layout effect there.
 */
export function applySavedTheme(): void {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
  } catch {
    // Storage blocked: the stylesheet follows the system theme.
  }
}
