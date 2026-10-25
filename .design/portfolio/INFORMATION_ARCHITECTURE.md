# Information Architecture: olaheavy.dev

> Phase 3 of the design flow · 2026-10-24 · Builds on `.design/portfolio/DESIGN_BRIEF.md`
> Greenfield: no routes, layouts or data layer exist yet. Stack: Next.js App Router + hosted Supabase, deployed via SoloForge.

## Site Map

Every public page sits behind a feature flag (see *Feature flags & discoverability*). Flag key in brackets.

- Home `/` [`page.home`, always on]
- Work `/work` [`page.work`]
  - Case study for HBK: Advantage Aiana `/work/hbk-aiana` [`case.hbk-aiana`]
  - Case study for Optty: payments orchestration `/work/optty` [`case.optty`]
  - Case study for Access Bank: QuickBucks & Instant Account `/work/access-bank` [`case.access-bank`]
  - Case study: Foresight `/work/foresight` [`case.foresight`] (also surfaced from Lab)
  - Compact stops (no page; inline-expanding tickets with anchors on `/work`):
    `/work#mukuru` · `/work#ulesson` · `/work#stanbic-ibtc` · `/work#galooli`
- Lab `/lab` [`page.lab`]
  - Project anchors `/lab#foresight` · `/lab#fastpilot` · `/lab#homescout` · `/lab#sabitutor`
  - (Foresight's card links to `/work/foresight`; others link out to repo/demo)
- Writing `/writing` [`page.writing`]
  - Post `/writing/[slug]` (Hashnode slug, canonical to olaheavy.dev)
  - Tag `/writing/tag/[tag]` (only when ≥ 3 posts share a tag)
- Travel `/travel` [`page.travel`]
  - Country `/travel/[country]` (ISO-name slug, e.g. `/travel/albania`): globe flies to country, gallery sheet open
  - Trip `/travel/[country]/[trip]` (e.g. `/travel/albania/tirana-2026`): gallery filtered + lightbox deep-link via `?photo=[id]`
- About `/about` [`page.about`]
- Résumé `/resume.pdf` (served from Supabase Storage via stable redirect; admin replaces file)
- Utility & system
  - Not found (“Wrong turn”): any unknown URL
  - `/colophon` → redirect to `/about#colophon`
  - `/sitemap.xml`, `/robots.txt`, `/rss.xml` (writing), `/og/[...]` (dynamic OG images)
  - `/api/ask` (assistant streaming), `/api/hashnode/webhook`, `/api/revalidate`, `/healthz` (SoloForge/App Registry)
- Admin `/admin` (owner only; `noindex`; Supabase Auth + MFA; never in nav/sitemap)
  - Overview `/admin`
  - Content `/admin/content`: case studies, compact stops, Lab projects, About copy, home selections
    - Item editor `/admin/content/[type]/[id]`
  - Media library `/admin/media`
  - Travel `/admin/travel`: countries, trips, journey order
    - Trip editor `/admin/travel/[tripId]`
  - Writing sync `/admin/writing`: Hashnode status, last sync, manual resync, per-post visibility
  - Assistant `/admin/assistant`: knowledge sources, re-index, eval runs, conversation samples, spend cap
  - Feature flags `/admin/flags`
  - Settings `/admin/settings`: availability text, email, résumé file, socials, SEO defaults

## Navigation Model

- **Primary navigation (floating pill, centred):** Work · Lab · Writing · Travel · About (5 items maximum). Active item has a lilac pill that slides between items. Items whose flag is off are removed (no gaps, no disabled states).
- **Brand (left pill):** illustrated avatar (small) + "Sunkanmi Olawuwo" → `/`.
- **Utility (right cluster):** ⌘K icon button · theme toggle icon button · **Email me** solid ink pill (primary CTA, copies email + opens mailto menu).
- **Assistant launcher:** avatar bubble fixed bottom-right on every public page (except when its flag is off); opens the Ask Sunkanmi panel. Not in the nav.
- **Secondary navigation:**
  - Work: filter chips (All · AI · Payments & banking · Data & IoT · Edtech; each stop belongs to at least one: HBK is AI and Data & IoT, Galooli is Data & IoT, uLesson is Edtech, Optty, Access Bank, Stanbic IBTC and Mukuru are Payments & banking), sticky under the page title.
  - Case study: sticky "On this page" TOC with scroll-spy (side column ≥1280px; top disclosure below) + "Next stop" footer linking the next case study in route order.
  - Travel: timeline scrubber + country list (also the accessible alternative to the globe).
  - Writing: tag chips (when enabled) and older/newer pagination.
- **Contextual links:** ticket metric chips → sources; assistant citations → exact section anchors; Lab Foresight ↔ Work Foresight; About career route → each stop.
- **Footer (every page):** Email · LinkedIn · GitHub · Hashnode · Résumé · RSS · Colophon line (Lighthouse badges, "Built with Next.js + Supabase, deployed on my own VPS") · passport progress mini-indicator.
- **⌘K palette (global):** Go to (all pages, case studies, countries, latest posts) · Ask Sunkanmi… · Copy email · Toggle theme · Open passport · Download résumé · (hidden) secret station.
- **Mobile navigation (<768px):** top bar shrinks to brand + Email icon; a **bottom dock** carries Work · Lab · Ask (avatar) · Writing · More (sheet: Travel, About, ⌘K actions, theme). Dock hides on scroll down, shows on scroll up.
- **Depth:** max 3 levels in public IA (Travel → Country → Trip); everything else ≤ 2.

## Content Hierarchy

### Home `/` (≤ 5 viewports at 1440×900)
1. **Hero:** "Hi, I'm [Sunkanmi]" (name as lilac object) + one-liner "I take products from idea to production, with AI built in." + **Email me** + "Ask me anything" (opens assistant) + availability chip (role openness + live UK time) + illustrated avatar (wave). *Answers the 5-second test.*
2. **Logo rail:** HBK, Mukuru, uLesson, Optty, Stanbic IBTC, Access Bank, Galooli (monochrome; Deimos noted as "via Deimos" on client logos). *Instant credibility.*
3. **Journey stations:** Idea → Design → Build → Ship → Scale; each station has a one-line capability and links to the evidence (a case-study section). The route begins here. *Turns the positioning into proof paths.*
4. **Selected stops:** 3 large tickets: HBK Aiana (production AI), Optty (payments), Foresight (AI product end-to-end), each with a sourced chip. "See the whole route →" `/work`. *Depth on the three strongest proofs.*
5. **Lab & Writing (two-up):** Lab strip: Foresight / FastPilot / HomeScout mini cards; Latest writing: 3 Hashnode posts. Each half collapses if its flag is off. *Shows ongoing craft.*
6. **Next stop (contact band):** "Next stop: your product." Email (copy + mailto) and résumé. *Closes on the primary CTA.*

### Work `/work`
1. Title + one-line framing ("Ten years of production, from Lagos to the UK") + filter chips.
2. Vertical route, newest first: HBK (2024 to now) → Deimos clients: Mukuru, uLesson, Optty (2022–24) → Stanbic IBTC (2021–22) → Access Bank (2018–21) → Galooli (2016–18).
3. Flagship tickets (HBK, Optty, Access) open case studies; compact tickets (Mukuru, uLesson, Stanbic, Galooli) expand inline: context, what he built, outcome (per claims policy), stack.
4. Cross-link band: "Building on my own time → Lab" (Foresight).
5. Next stop contact band.

### Case study `/work/[slug]`
1. Title (outcome-led) + meta grid (Company · Role · When · Stack · Team) + hero visual.
2. TL;DR (≤ 4 bullets) + 3 sourced outcome chips.
3. Numbered sections with sticky TOC: 01 Context & problem → 02 Design decision (V1→V2) → 03 Architecture (diagram) → 04 Shipping to production (reliability, evals, security, rollout) → 05 Trade-off / incident → 06 Results (sourced) → 07 What I'd do differently.
4. Next stop (next case study) + contact band.
*HBK variant: architecture shown as a non-confidential conceptual diagram (sources → ingestion → retrieval → LLM → cited answer → evals/monitoring); no internals.*

### Lab `/lab`
1. Title + framing ("Things I build to learn. Most of them shipped.").
2. Foresight (feature card, GIF, evidence links: GitHub, case study; "Try it" because a live URL is set).
3. FastPilot (screenshots/Loom, eval stats from repo, GitHub link; no "Try it" until a live URL is set).
4. HomeScout (small "In progress" tag, decision-records angle; AI concept images captioned).
5. SabiTutor (small "In progress" tag, teaser only, no links yet).

Lab cards show evidence, not status badges: GitHub, a demo video or GIF, a write-up or case study, and "Try it" only while a live URL exists. The only status mark is a small "In progress" tag; there are no Live or Coming soon badges.

### Writing `/writing` and `/writing/[slug]`
- Index: featured latest post → list (title, date, reading time, tags) → pagination → RSS link.
- Post: title, date, reading time, cover → body (code highlighting, headings TOC on long posts) → "Discuss on Hashnode" link → next/previous → contact band.

### Travel `/travel`
1. Globe (lazy) with static map placeholder; journey arcs (Lagos → UK 2022, UK → Albania 2026) + home marker.
2. Timeline scrubber + country list (accessible alternative; works without WebGL).
3. Country gallery sheet (on selection): country name, years, short story, trips → masonry gallery → lightbox.
4. Short "why I travel" note; counts (countries, trips) generated from data.

### About `/about`
1. Portrait (real photo) + short story (Lagos → UK, engineer who designs).
2. Career route (all stops, compact) linking to Work.
3. How I work (principles: evals before vibes, secure by design, TDD/BDD, observability).
4. Skills by layer (Product · Interfaces · Services · AI · Infra).
5. Education + certifications.
6. Colophon `#colophon` (stack, hosting on own VPS, performance/accessibility scores).
7. Contact band.

### Ask Sunkanmi panel (overlay)
1. Avatar + greeting + scope line ("I answer questions about Sunkanmi's work, using his site and writing").
2. Suggested prompts (4): "What has he shipped with AI?" · "Tell me about his payments work" · "How does he evaluate LLM features?" · "Is he open to roles?"
3. Conversation (streaming, citations as chips → deep links).
4. "How this works" toggle (sources, latency, tokens, cost) · privacy note · email CTA.

### Admin `/admin` (Overview)
1. Health: last deploy (sha), Hashnode last sync, assistant last eval result, spend this month.
2. Feature flags quick toggles.
3. Recent media uploads + items missing alt text.
4. Shortcuts: add trip, re-index assistant, replace résumé.

## User Flows

### 1. Hiring manager: 60-second screen
1. Lands on `/` from a LinkedIn/CV link.
2. Hero: reads role + one-liner, sees availability chip → understands "production AI engineer who designs".
3. Scans logo rail and Selected stops.
   - If convinced → clicks **Email me** → mailto opens / email copied (toast "Email copied") → done.
   - If wants depth → opens HBK ticket → `/work/hbk-aiana` → reads TL;DR + outcome chips → Email me in contact band.
   - If wants proof of ownership → clicks Foresight → live site / case study.
4. Optional: downloads résumé from footer or nav ⌘K.

### 2. Founder: consulting enquiry
1. Lands on `/` or a Writing post from search/social.
2. Opens assistant → asks "Can he build an AI MVP for us?" → answer cites Foresight + HBK sections + availability.
3. Follows citation → `/work/foresight#architecture` (section highlighted).
4. Clicks Email me (prefilled subject "Project enquiry").

### 3. Assistant → evidence
1. Visitor opens launcher (never auto-opens) → sees 4 suggested prompts.
2. Chooses or types a question.
   - In scope → streamed answer with citations → click citation → navigates to section anchor, panel stays open (desktop) / minimises (mobile).
   - Out of scope / unsafe → graceful refusal + suggested on-topic prompts.
   - Budget exceeded / error → friendly fallback + Email me.
3. Optional: toggles "How this works" to inspect sources, latency, cost.

### 4. Travel exploration
1. `/travel` loads placeholder map + country list instantly; globe hydrates on idle/intent.
2. Visitor scrubs timeline or clicks a country (globe or list).
3. URL updates to `/travel/[country]`; camera flies; gallery sheet opens.
4. Opens a photo → lightbox (`?photo=` param) → arrows/swipe → Esc returns focus to the photo tile.
5. Passport stamps "Travel".

### 5. Passport collection
1. First visit to Work, any case study, Lab, Writing, Travel, About → stamp + toast (dismissible, polite announce).
2. Progress visible in footer mini-indicator and ⌘K → "Open passport".
3. All six stamps (+ optional secret station via ⌘K) → unlocks a personal note card; reset available.

### 6. Owner: add a trip with photos
1. `/admin/travel` → Add trip (country, city, dates, story).
2. Drag photos → upload → processing (EXIF/GPS strip, blurhash, variants) → require alt text → set cover + order.
3. Save as draft → preview → publish → `/travel/[country]/[trip]` revalidated; journey arcs update.

### 7. Owner: publish writing
1. Publishes on Hashnode → webhook hits `/api/hashnode/webhook` → post synced + `/writing` revalidated → assistant knowledge re-index queued.
   - If webhook fails → `/admin/writing` shows stale warning → manual "Resync".

### 8. Owner: toggle a page
1. `/admin/flags` → set `page.travel` to Off / Owner preview / On.
2. On save: nav, footer, ⌘K, sitemap, assistant citations and home sections recompute; disabled URLs return 404 (owner-preview shows a banner when signed in).

## Feature Flags & Discoverability

| State | Public visitors | Owner (signed in) | Nav / ⌘K / footer | Sitemap & robots | Assistant |
|---|---|---|---|---|---|
| On | Visible | Visible | Listed | Included | May cite |
| Owner preview | 404 | Visible + "Preview" banner | Hidden | Excluded, `noindex` | Must not cite |
| Off | 404 | 404 (admin link to enable) | Hidden | Excluded | Must not cite |

Flags: `page.home` (locked on), `page.work`, `page.lab`, `page.writing`, `page.travel`, `page.about`, `case.*` (per case study), `feature.assistant`, `feature.passport`, `feature.cmdk`, `feature.globe3d` (off → 2D map + list only). Home sections bound to a disabled page collapse without gaps.

## Naming Conventions

| Concept | Label in UI | Notes |
|---|---|---|
| A job / engagement / project on the route | **Stop** (e.g. "Stop 04 · Optty") | Route metaphor; "Project" only in Lab. Stops count up from the first job: Galooli 01, Access Bank 02, Stanbic IBTC 03, Optty 04, uLesson 05, Mukuru 06, HBK 07 ("Stop 07 · Now"). A stop keeps its number everywhere |
| Card representing a stop | **Ticket** (internal name) | UI shows the stop name, not "ticket" |
| Full write-up | **Case study** | Clear to recruiters; don't call it "story" |
| Short inline write-up | (no label); an expanding ticket | "Read more" / "Show less" |
| Personal projects section | **Lab** | Not "Playground" or "Side quests" |
| Project status | **In progress** (tag) | Lab cards carry only a small "In progress" tag while the work is unfinished; no Live or Coming soon badges. "Try it" appears only while a live URL is set |
| Blog | **Writing** | Posts are "posts", not "articles" |
| Five capabilities | **Idea · Design · Build · Ship · Scale** | Always in this order |
| Contact band | **Next stop** | CTA text always "Email me" |
| Assistant | **Ask Sunkanmi** | Speaks in third person about Sunkanmi ("He built…") to avoid impersonation; avatar is a guide |
| Assistant source chips | **Sources** | Not "references"/"citations" in UI |
| Collected stamps | **Passport** / **Stamp** | |
| Travel units | **Country → Trip → Photo** | |
| Availability | "Open to senior & staff AI roles · consulting" | Editable in admin |
| Employer via consultancy | "Optty · via Deimos" | Consistent attribution |
| Page visibility | **On · Preview · Off** | Admin only |

## Component Reuse Map

| Component | Used on | Behavior differences |
|---|---|---|
| `SiteShell` (pill nav, footer, assistant launcher, ⌘K, passport provider) | All public pages | Admin uses separate `AdminShell` |
| `AdminShell` (sidebar, auth guard) | All `/admin/*` | Owner only |
| `Route` (dotted path + pins) | Home stations, Work list, About career, Travel arcs (3D variant), Next-stop band | Vertical (Work/About; Home stations on phones), horizontal strip (Home stations from md), inline (inside a sentence), 3D arcs (Travel) |
| `Ticket` | Home selected stops, Work list, About career, Lab (project variant) | Sizes: large / compact / mini; compact expands inline |
| `MetricChip` | Tickets, case-study TL;DR & results, Lab cards | Source shown as tooltip (desktop) / tap sheet (mobile) |
| `PageHeader` (eyebrow mono label + display title + intro) | Work, Lab, Writing, Travel, About, case studies | Case study adds meta grid |
| `CaseStudyLayout` (TOC + numbered sections) | `/work/[slug]` | HBK uses conceptual diagram variant |
| `ContentRenderer` (rich text/MDX-like blocks) | Case studies, compact stops, Writing posts, About | Writing renders Hashnode HTML/markdown |
| `NextStopBand` | End of every public page | Copy varies by page |
| `GallerySheet` + `Lightbox` | Travel country/trip; case-study image sets | Travel adds trip filter |
| `AvatarIllustration` (poses) | Hero, assistant, 404, Travel, Next stop | Pose prop |
| `InProgressTag` | Lab ("In progress" tag) | Small tag only; the admin shows flag states with its own component |
| `Toast` | Passport stamps, admin saves | Polite live region (Copy email prints a boarding pass instead) |
| `CommandPalette` | Global | Secret station only for public |

## Content Growth Plan

| Area | Growth | Accommodation |
|---|---|---|
| Writing | Steady (Hashnode) | Paginated index (10/page), tags at ≥ 3 posts, RSS, search via ⌘K (titles) |
| Travel | Steady (trips, photos) | Country → Trip hierarchy; galleries lazy + paginated by trip; timeline scales with arcs; counts derived from data |
| Lab | Slow | Grid with status; archive section "Earlier experiments" when > 6 projects |
| Work | Slow | New stops appended at top of route; compact by default, promote to case study via admin |
| Assistant knowledge | Grows with all of the above | Auto re-index on publish; eval set extended per new case study |
| Media | Grows | Admin media library with search, filters (unused, missing alt), usage references |

## URL Strategy

- **Pattern:** `/section/item-slug` (max 3 segments: `/travel/[country]/[trip]`). Lowercase, hyphenated, ASCII, no trailing slash, no spaces.
- **Dynamic segments:** `[slug]` (case study, post), `[country]` (lowercase English country name slug), `[trip]` (`city-year`), `[tag]`.
- **Anchors:** case-study sections use stable IDs (`#context`, `#design`, `#architecture`, `#production`, `#tradeoffs`, `#results`, `#reflection`) so assistant citations and TOC links never break; compact stops use company slugs on `/work`.
- **Query parameters:** `?filter=ai|payments|data-iot|edtech` (Work), `?page=n` (Writing), `?photo=[id]` (lightbox), `?ref=` (assistant citation highlight). Filters are shareable; default state has no params.
- **Canonical & SEO:** every page has its own canonical, title, description and dynamic OG image (`/og/...`); Hashnode posts canonical to `/writing/[slug]`; flagged-off pages 404 and are excluded from the sitemap.
- **Redirects:** slugs are permanent; renames create 308 redirects managed in admin. `/blog/*` → `/writing/*`, `/projects` → `/lab`, `/cv` → `/resume.pdf`.
- **Hard refresh safety:** all routes are server-rendered/ISR, with no client-only routes (avoids the SPA 404s seen in the inspiration set).
