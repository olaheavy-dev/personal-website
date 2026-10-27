# Design Brief: olaheavy.dev, Sunkanmi Olawuwo's Personal Site

> Owner: Sunkanmi Olawuwo · Date: 2026-10-24 · Status: Approved direction (Phase 2 of design flow)
> Sources: grill session (Q1 to Q27 + open items), `supporting-documents/` (CV, project notes, photos, logos),
> `supporting-documents/research/` (hbk.md, deimos-clients.md, banking-and-galooli.md, personal-projects.md, inspiration-teardown.md).

## Problem

A hiring manager at an AI or product company opens a link to a candidate's site between meetings. They have under a minute to answer three questions: *what does this person do, can they really ship AI to production, and should I email them?* Most engineering portfolios make that hard. They either show a grid of screenshots with no proof of engineering depth, or a terse list of repos with no sense of product judgement or personality. AI claims are everywhere and rarely backed by evidence.

Sunkanmi's real story (ten years from IoT in Lagos, through regulated banking and cross-border payments, to shipping a production RAG assistant at HBK) is strong but currently lives in a CV. A secondary visitor, a founder looking for help building an AI product, has the same problem: they need to trust that he can take their idea all the way to production, not just a demo.

## Solution

A warm, confident, personal site that reads like a journey: **idea → design → build → ship → scale**. A single dotted route runs through the site; each piece of work is a "stop" presented as a ticket, and each case study proves one leg of the journey with real, sourced evidence: architecture, trade-offs, results. The first screen says who he is in one sentence and offers one action: email him.

Personality comes from three concentrated delights, not decoration: an illustrated Sunkanmi who *is* the "Ask Sunkanmi" assistant (grounded, cited, and transparent about how it works, so the site proves his AI craft), a ⌘K route palette, and passport stamps collected as visitors explore. The same route language becomes literal on the Travel page, where a 3D globe draws his journey from Lagos to the UK and beyond.

Behind the public site sits his own admin: image pipeline, Hashnode sync, assistant knowledge base and per-page feature flags. The admin is itself a demonstration of full-stack product thinking.

## Positioning & Content Strategy

- **One line:** "I take products from idea to production, with AI built in." (Products first, with AI as the multiplier rather than the whole story; updated 2026-10-24 after the hero review.)
- **HBK framing:** he builds the Advantage Insights sensor-data analytics platform *and* the AI inside it: RAG (Aiana), AI agents and the analytics product itself.
- **Narrative:** AI-led. HBK (Aiana) and personal AI projects up front; banking and payments (Access, Stanbic, Optty, Mukuru) as proof of years of high-stakes, regulated production; uLesson and Galooli as range.
- **Primary CTA:** Email me. Secondary: Résumé (PDF), Ask Sunkanmi.
- **Audiences:** 1) hiring managers / eng leaders (senior, staff, founding roles); 2) founders seeking consulting.

### Claims policy (non-negotiable)

| Claim | How it appears |
|---|---|
| HBK / Aiana | Named publicly; launched in Advantage Insights 2025 R4 (public, HBK). Stack named (C#/.NET, Python, Azure AI Foundry, RAG, evals), with no internal diagrams, prompts, models or metrics. Later HBK AI features described generically: "AI agents for features like Python code suggestions and file data analysis" (owner decision, 26 Oct 2026), with no internals. |
| RagLab | Not listed as a personal project; its evaluation approach is referenced generically inside the HBK case study. |
| Access QuickBucks | Public figure only: **1M+ Google Play downloads**. No internal revenue or user counts. |
| Stanbic EZ Cash | Reliability work described qualitatively; no failure-rate number. |
| Optty | Public: **90+ BNPL & local payment methods across 120+ countries (Optty)**, linked to the Optty and Triple-A announcement, which carries the date (credits show no year, owner decision 26 Oct 2026), framed as the platform he built integrations for. |
| uLesson | No figures, like Stanbic IBTC. The work is described qualitatively. |
| Galooli | Galooli's published Nigeria result (~11% fuel saving across several hundred sites, 2021) cited as company context, not a personal claim. |
| Mukuru | Integration work only. Company context: **17M+ customers served (Mukuru)**, linked to Techzim's 20 years of Mukuru article. Do not imply he built the Oct 2024 Malawi wallet launch. |
| Personal projects | Repo-verified figures only (e.g. Foresight 17 eval suites; FastPilot faithfulness 0.992, ~210 tests, 90% coverage gate). |

Every number on the site carries a source (public link, repo link, or "own measurement").

## Experience Principles

1. **Proof over polish.** Every claim is backed by something a visitor can inspect: a sourced metric, a diagram, a live link, a citation. When a section has to choose between another animation and another piece of evidence, evidence wins.
2. **Warm, not cute.** Personality through a real person (illustrated self, voice, journey, travel) and a few crafted moments, never through clutter. Three delights, each excellent; nothing blocks reading or navigation.
3. **Fast is the first impression.** The site is itself a production artefact. No intro loaders, no scroll-jacking, content in under a second, heavy experiences (globe, assistant) loaded only on intent.

## Aesthetic Direction

- **Philosophy:** *Journey / transit editorial*: warm paper and ink, a single dotted route as the narrative spine, ticket-like cards for work, pill UI, bold tight grotesk type, and mono "station labels" for data.
- **Tone:** warm, confident, curious, quietly playful; credible enough for a staff-level hiring panel.
- **Palette:** paper `#FAF8F5`, ink `#141418`, lilac `#CDB8FF`, teal `#1FA59A` (exact tints, contrast-safe text variants and a designed dark "night route" theme defined in Phase 4).
- **Type:** Bricolage Grotesque (display, 700–800, tracking −0.03 to −0.05em), Geist (body, ≥17px), Geist Mono (labels, route stations, data).
- **Motion:** expo-out `cubic-bezier(0.22,1,0.36,1)` 250–600ms for reveals and hovers; spring `cubic-bezier(0.34,1.56,0.64,1)` for small pops (stamps, chips); 150ms for colour changes. All non-essential motion off under `prefers-reduced-motion`.
- **Reference points (his top picks):** Bunmi Akinremi (dotted route + pins, lilac/teal), Owoetoni (tactile tickets/folders, ⌘K, career-as-objects, case-study TOC), Omowunmi Junaid (illustrated self, passport stamps, Bricolage), Marian Gasinu (avatar assistant with suggested prompts, live clock, availability), Jeffrey De-Graft Hinson (calm confident hero with inline pills), Prince Essandoh (dock nav, product mockups), Oyenekan Emmanuel (AI chat, physics pills).
- **Anti-references:** generic dark "developer terminal" portfolios; AI gradient blobs; intro loaders and scroll-locked heroes; 4–12k-px homepages with competing toys; mascots that talk without substance; screenshot grids with no proof; heavy WebGL on first paint.

## Existing Patterns

Greenfield: the repository contains only `README.md` and `supporting-documents/`. No tokens, components, Tailwind config, fonts or routes exist. Decided foundations to build on:

- **Framework:** Next.js (App Router, TypeScript), Docker image deployed via SoloForge (GitHub Actions → GHCR → Watchtower → Caddy behind Cloudflare) at **olaheavy.dev**.
- **Data/Auth/Storage:** hosted Supabase (Postgres + pgvector, Auth, Storage with image transforms).
- **Infra conventions to respect:** `.env.example` only in repo; immutable `sha-<commit>` image tags + `main`; no public host ports; health endpoint for the App Registry; secrets server-side (`/home/apps/<app>/.env`).
- **Assets available:** company logos (`supporting-documents/logo/`: HBK, Deimos, Optty, Mukuru, uLesson, Stanbic, Access, Galooli), two portrait photos (studio, grey background), Foresight GIF + 9 screenshots, FastPilot 4 screenshots + Loom, HomeScout concept images (AI-generated, so they must be captioned).

## Information Scope (pages)

Each page is wrapped in a feature flag (on / off / owner-preview). Detailed structure is Phase 3.

| Page | Purpose |
|---|---|
| Home | 5-second answer + journey + selected stops + email CTA (≤ 5 viewports at 1440×900) |
| Work index + Case studies | HBK Aiana (flagship), Optty, Access QuickBucks / Instant Account, Foresight (flagship personal), plus shorter entries for Mukuru, uLesson, Stanbic, Galooli |
| Lab | Foresight, FastPilot, HomeScout (in progress), SabiTutor (in progress); GIF and screenshot-led cards |
| Writing | Hashnode posts rendered natively at `/writing/<slug>`, canonical to olaheavy.dev |
| Travel | 3D globe, journey arcs + timeline, per-country gallery (Nigeria home, UK 2022 to now, Albania 2026) |
| About | Story, portrait, career-as-route, certifications, education, colophon (perf/a11y badges) |
| Admin (`/admin`) | Content, images, travel, Hashnode sync, assistant knowledge + evals, feature flags |

## Component Inventory

| Component | Status | Notes |
|---|---|---|
| Route line (SVG dotted path + station pins) | New | Signature; animates draw-on-scroll; static under reduced motion |
| Floating pill nav + theme toggle + ⌘K trigger | New | Detaches on scroll; mobile becomes bottom dock |
| Hero "Hi, I'm [Sunkanmi]" with object-word + avatar | New | Name in lilac pill/highlight; illustrated avatar pose "wave" |
| Availability + UK local-time chip | New | Live clock; "Open to senior/staff AI roles & consulting" |
| Journey stations strip (Idea→Design→Build→Ship→Scale) | New | Each station links to evidence |
| Ticket card (work stop) | New | Notched ticket shape, stop number, company logo, outcome chips, sourced metric |
| Metric chip with source | New | Value + label + source tooltip/link |
| Company logo rail | New | Monochrome logos, colour on hover |
| Case-study layout | New | Meta grid, TL;DR ≤ 4 bullets, sticky TOC with scroll-spy, numbered sections, next-stop footer |
| Architecture diagram block | New | Built from HTML boxes/SVG, theme-aware, captioned |
| Decision (V1→V2) block | New | Before/after with rationale |
| Lab card (GIF/video-led) | New | Lazy GIF/MP4, evidence links (GitHub, demo video or GIF, write-up or case study), "Try it" only while a live URL is set, small "In progress" tag; no Live or Coming soon badges |
| Writing list + article renderer | New | Hashnode GraphQL; code highlighting; reading time; canonical |
| Travel globe (r3f) + timeline scrubber + journey arcs | New | Lazy-loaded; static map placeholder; list fallback |
| Country gallery sheet + lightbox | New | Masonry, blurhash placeholders, keyboard nav, captions |
| Ask Sunkanmi panel + avatar launcher | New | Suggested prompts, streaming, citations deep-linking to sections, "How this works" trace, refusal state |
| ⌘K route palette | New | Navigate, theme, ask assistant, copy email; one hidden "secret station" |
| Passport (stamps) | New | Stamp on visiting stops/pages; small dismissible toast; passport view in ⌘K/footer; reset; no sound by default |
| Email CTA / "What's next" contact band | New | Copy-email button + mailto |
| Footer with colophon | New | Built-with, Lighthouse badges, socials, résumé |
| 404 "Wrong turn" page | New | Avatar pose + route back home |
| Admin shell + forms, image uploader, flags table | New | Supabase Auth (owner only), MFA |

## Key Interactions

- **First visit:** no loader. Hero renders server-side; avatar gives a single small wave (once, skipped under reduced motion). Availability chip shows live UK time.
- **Route on scroll:** the dotted line draws as the visitor moves through stations; reaching a stop subtly highlights its pin. Never hijacks scroll.
- **Ticket hover/focus:** lifts 4px, notch shadow deepens, each figure links to its source; Enter/click opens the case study.
- **Case study:** sticky TOC tracks the current section; each figure links to its source; "Next stop" footer continues the route.
- **Ask Sunkanmi:** avatar launcher bottom-right; never auto-opens. Opening shows 4 suggested prompts. Answers stream (first token < 1s), cite sources as chips that deep-link to the exact section (with highlight on arrival). Out-of-scope → graceful refusal + suggestion. "How this works" toggle reveals retrieved passages, latency, tokens and cost for that answer.
- **⌘K:** opens a palette for navigation, theme, "Ask…", copy email; typing a hidden word reveals the secret station (and a passport stamp).
- **Passport:** first visit to Work, a case study, Lab, Writing, Travel and About each stamps the passport (spring pop + toast, 2.5s, dismissible, announced politely to screen readers). Completing it unlocks a personal note. Stored locally; resettable.
- **Travel:** globe idles slowly; journey arcs animate in date order with a timeline scrubber; clicking a country (or choosing from the list) flies the camera there and opens a gallery sheet; lightbox with arrow keys and swipe; each country/trip has its own URL.
- **Theme:** toggle in nav and ⌘K; follows system by default; persisted; no flash.
- **Admin:** drag-drop images → upload to Supabase Storage → EXIF/GPS stripped, blurhash + responsive AVIF/WebP variants; assign to country/trip; toggle feature flags with immediate effect; trigger Hashnode resync; re-index assistant knowledge and run its eval set.

## Responsive Behavior

- **≥1280px:** content max-width ~1200px; route runs vertically in a left gutter on Home and Work; case studies show sticky TOC in a side column.
- **768–1279px:** route moves inline above sections; tickets in two columns; TOC collapses to a top "On this page" disclosure.
- **<768px:** pill nav becomes a bottom dock (Home, Work, Lab, Ask, ⌘K/menu); route becomes a compact horizontal station strip; tickets stack full width; assistant opens as a full-height sheet; globe renders a 2D projected map + country list by default with "Open 3D globe" on intent; gallery is a swipeable carousel.
- Touch targets ≥ 44px; no hover-only information (sources reachable by tap).

## Accessibility Requirements

- WCAG 2.2 AA throughout; Lighthouse Accessibility 100 on every public page.
- Text contrast ≥ 4.5:1 (lilac and teal used as fills/decoration; text-on-accent uses tested ink/teal-dark variants), including mid-animation states.
- Full keyboard operation: nav, tickets, ⌘K, assistant (focus trapped in panel, Esc closes, focus returns to launcher), gallery/lightbox, globe (country list fallback with the same actions).
- Visible focus ring tokenised for both themes; skip-to-content link.
- Screen readers: route and decorative SVG `aria-hidden`; diagrams have text alternatives; streaming assistant output announced via polite live region in sentence chunks; stamps announced politely.
- `prefers-reduced-motion`: disables route drawing, avatar wave, stamp pops, globe auto-rotation and arcs animation.
- Every route has a stable URL that works on hard refresh; images have meaningful alt text (admin requires it on upload).

## Quality Bar: "Better than all seven"

1. **Speed:** home ≤ 600KB initial transfer (globe excluded); LCP ≤ 1.5s (mobile 4G); CLS < 0.05; no blocking loader; Lighthouse Performance ≥ 95 mobile.
2. **Accessibility:** Lighthouse 100; AA contrast in all states; keyboard + reduced-motion verified.
3. **Robust routing:** 0 × 404s on a crawl; per-page OG images; stable, readable slugs.
4. **Proof density:** each flagship case study has TL;DR ≤ 4 bullets, ≥ 3 sourced outcomes (or sourced public facts), one architecture diagram, one V1→V2 decision, one production trade-off or incident, sticky TOC.
5. **Grounded assistant:** suggested prompts; first token < 1s; every answer cited and deep-linked; graceful refusals; "How this works" trace; keyboard-operable; never auto-opens; passes its own eval set in CI.
6. **One metaphor:** the route appears in ≥ 4 places (hero, work, travel, contact "next stop"); no competing gimmick system.
7. **Type & colour discipline:** 2 typefaces + 1 mono; designed light and dark themes; no theme flash.
8. **Delight budget:** exactly three (assistant, ⌘K, passport), each discoverable within 10s, none blocking; sound off.
9. **Globe quality:** loaded on route/intent only; ≤ 250KB gzip for the 3D layer; 60fps M1 / ≥ 45fps mid Android; static placeholder until hydrated; accessible list fallback.
10. **Five-second test:** 4 of 5 testers can state his role, name one domain (production AI or payments/banking) and find the email CTA; home ≤ 5 viewports at 1440×900.

## Out of Scope

- Native mobile apps; i18n/multilingual content (English only at launch).
- A public guestbook, comments, or any user-generated content on the public site.
- Authoring blog posts in the admin (Hashnode remains the editor; the site reads and renders).
- E-commerce, newsletter/email marketing, analytics dashboards beyond a privacy-friendly page-view counter.
- Sound design (sound is off; no audio assets at launch).
- Final illustrated avatar artwork (art brief + placeholder slots are in scope; the illustration itself is produced separately from the two supplied photos).
- SoloForge infra changes beyond onboarding this app per `wiki/new-project-onboarding.md`.
- Naming HBK features beyond Aiana; any internal HBK architecture, metrics, prompts or code.
- RagLab as a standalone Lab project; SoloForge Infra as a Lab project.

## Open Items

- Travel photos and trip stories: supplied via admin after launch of the Travel page (seeded countries: Nigeria (home), UK 2022 to now, Albania 2026).
- Illustrated avatar production (illustrator or image model) from `Andela_Profile.jpeg` and `GeneralProfilepic.jpeg`; poses: wave (hero), thinking (assistant loading), pointing (CTA), travelling (globe), lost (404).
- FastPilot demo is down (Railway 404). Redeploy via SoloForge or link the Loom until then.
- Hashnode publication host/handle needed for the integration.
