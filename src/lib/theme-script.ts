// How long a page waits for its script before showing routes finished. The route's
// undrawn state applies from first paint (so there is no finished then undrawn
// flash), which means a script that never loads would leave it undrawn for good.
// RouteObserver sets data-armed on mount; if the page has a route but none is armed
// by then, data-route-fallback on <html> switches the undrawn state off. Pages with
// no route never set it, so a later client navigation to a route still draws.
// Well above a normal hydration time.
const ROUTE_FALLBACK_MS = 3000;

// Runs before first paint. Marks that JavaScript runs (data-js, which gates the
// route's undrawn state), arms the fallback above, and applies a saved theme.
// With no saved choice the stylesheet follows prefers-color-scheme, so there is
// nothing to set for the theme. Shared by the root layout and the global error page.
export const themeScript = `(function(){var h=document.documentElement;h.setAttribute("data-js","");setTimeout(function(){if(document.querySelector("[data-route]")&&!document.querySelector("[data-armed]"))h.setAttribute("data-route-fallback","")},${ROUTE_FALLBACK_MS});try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")h.setAttribute("data-theme",t)}catch(e){}})()`;
