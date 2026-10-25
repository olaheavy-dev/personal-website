# 0017: Content Security Policy and security headers

**Status:** Accepted  
**Date:** 2026-10-25  
**Decided by:** the owner (issue #53)

## Context

A Content Security Policy (CSP) tells the browser which sources a page may load scripts, styles, images and connections from, so a script an attacker manages to inject is refused. The usual strict form gives every inline script a one time "nonce" (a random value) that the server generates for each response.

Next.js 16 writes its own small inline scripts into every page, so a strict policy must either carry a nonce on each of them or allow inline scripts. A nonce needs a different response for every visitor. The bundled Next.js guide says plainly that nonces require dynamic rendering, and that Partial Prerendering and nonces do not mix. This site uses Cache Components and prerenders its public pages (`/`, `/work`, `/lab`, `/writing`, `/travel`, `/about`).

The original task list said "script nonces". That wording is changed by this decision.

## Threat model

What an attacker could try, and what stands in the way:

- **Injected script on a public page.** The site has no visitor logins, no comments and no visitor content, so there is nowhere for a visitor to store script that another visitor would see. The two future sources of outside HTML are handled where they arrive: Hashnode post HTML is sanitised in the Writing task, and Ask Sunkanmi answers are rendered as text and markdown, never as raw HTML (assistant panel task). The policy is the second layer behind those.
- **Framing (clickjacking).** `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- **Data sent to another origin.** `connect-src 'self'`, `form-action 'self'`, `base-uri 'none'`.
- **Plugins and old tricks.** `object-src 'none'`, `frame-src 'none'`, `nosniff`.
- **Downgrade to http.** HSTS and `upgrade-insecure-requests`.
- **The admin.** `/admin` is the one place with a login and write access. It gets the strict nonce policy, because it is always rendered per request anyway.

## Options

1. **Nonce policy everywhere.** Strongest against injected scripts. Forces every page to render per request: Cloudflare could not cache the HTML (#54), the single VPS would render on every view (#56), and `scripts/check-budget.mjs` would have no prerendered page to measure.
2. **Hashes of Next's inline scripts.** They change on every build and Next adds more of them, so this breaks often and is fragile.
3. **Static policy for public pages with `'unsafe-inline'` for scripts, nonce policy only for `/admin`.** Pages stay prerendered and cacheable.

## Decision

Option 3.

- **Public pages:** `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`. `'unsafe-eval'` is added in development only. It is set in `next.config.ts` from `src/lib/security/headers.ts`, so the pages stay static.
- **`/admin`:** nonce plus `'strict-dynamic'`, the Supabase origin allowed in `connect-src` (https and wss) and `img-src`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, `Cross-Origin-Resource-Policy: same-origin`. The builder is written and unit tested (`src/lib/security/admin.ts`) but is not called from `src/proxy.ts` yet, because `/admin` does not exist. The "Admin shell + auth" task wires it in.
- **API (`/api/*`, `/healthz`):** `default-src 'none'; frame-ancestors 'none'`, `Cache-Control: no-store`, `Cross-Origin-Resource-Policy: same-origin`, no CORS.
- **Every response:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a Permissions-Policy that switches off camera, microphone, geolocation, payment, USB and browsing topics (fullscreen for this origin only), `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY`, and `Strict-Transport-Security: max-age=31536000`.
- **HSTS** has no `includeSubDomains` and no `preload`. Subdomains such as `foresight` are not all this project's to commit to https, and preload is hard to undo. Preload is a separate decision at production launch.
- **Enforced from the first merge**, not report only, and no reporting endpoint until error tracking exists (#55). The pages were checked first (see the spike in the pull request): nothing is blocked.
- **No feature flag.** A flag that could switch security headers off would be a risk in itself. Rollback is pinning the `:sha-<commit>` image tag.
- The app is the only source of these headers. Caddy also sets three of them today (see `docs/deploy.md`).
- **Not done here, as follow-up issues:** `Cross-Origin-Embedder-Policy` and Trusted Types.

## Consequences

- Public pages are not protected against injected inline script by the policy itself. That is a deliberate trade for static pages, and it is why the content that could carry script (Hashnode HTML, assistant output) is sanitised or never HTML before it gets here.
- Any new third party script, font, image host or embed needs a line in `buildCsp` and a test, so the policy grows on purpose. Cloudflare Email Obfuscation, Rocket Loader and Web Analytics must stay off, because each injects script or loads from another origin.
- `scripts/check-budget.mjs` fails if one of the six listed pages stops being prerendered, so the assumption this decision rests on is guarded.
- Revisit if the public site gains accounts, comments or any visitor content: then public pages move to a nonce policy, and the cache plan changes with it.
