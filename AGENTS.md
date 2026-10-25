# AGENTS.md

Shared instructions for every AI agent on this repository. `CLAUDE.md` is a symbolic link to this file, so Claude Code and OpenAI Codex read the same text. Edit **this** file only.

Who does what is in **"How work flows"**: Opus 5.5 plans and reviews, Fable 5.1 reviews only the highest-stakes changes, Sonnet 5.5 builds and verifies, Codex reviews every pull request except small dependency updates, and Claude Code merges. Builders follow "When building"; every reviewer follows "When reviewing"; merging follows "When merging".

## What this project is

The personal site of **Sunkanmi Olawuwo** at **olaheavy.dev**: a full-stack and AI engineer's portfolio that has to be world-class, warm and fast, and that proves "I take products from idea to production, with AI built in." It is a public repository, all rights reserved (see `LICENSE`). The site is also a portfolio artefact in its own right: its code, process and quality are part of the pitch.

Stack (decisions 0002 to 0004): Next.js 16 App Router + TypeScript (strict) + Tailwind CSS v4, pnpm, hosted Supabase (Postgres + pgvector, Auth, Storage), deployed as a Docker image to the owner's SoloForge VPS behind Cloudflare and Caddy.

Read before working:

- `.design/portfolio/DESIGN_BRIEF.md`: problem, principles, aesthetic, **claims policy**, quality bar
- `.design/portfolio/INFORMATION_ARCHITECTURE.md`: pages, URLs, navigation, flags, naming
- `.design/portfolio/DESIGN_TOKENS.css` (live copy in `src/styles/tokens.css`): the only source of colours, type, spacing and motion
- `.design/portfolio/TASKS.md`: build order; each task becomes a GitHub issue
- `docs/decisions/`: accepted decisions. Don't contradict one; propose a new record instead.
- `docs/references/third-party.md`: pinned versions and official documentation links

## Private source material

`supporting-documents/` (CV, portraits, logos, research notes, inspiration screenshots) exists only on the owner's machine and is git-ignored (decision 0010).

- You may read it to write content and to optimise assets.
- **Never commit it**, and never copy from it: phone numbers, personal addresses, the CV file, raw photos or private notes. Only intentional, optimised assets go into `public/` (e.g. a cropped, compressed portrait).
- Research notes separate public facts (with sources) from CV-only claims. Only the claims policy decides what reaches the site.

## Rules for every agent

1. **Claims policy (decision 0005).** Never invent facts, figures, dates, employers' features or quotes. Every number on the site carries a source (public link, repository link or "own measurement"). Follow the table in the design brief exactly. For example, QuickBucks shows only public Google Play downloads, Stanbic EZ Cash shows no number, Galooli's figure is attributed to Galooli, and HBK names only Aiana publicly.
2. **Employer confidentiality.** Name public products and stacks; never publish internal architecture, prompts, model names, metrics or code from any employer. RagLab is not shown as a personal project.
3. **Personal data.** The only contact details on the site are the published email (`NEXT_PUBLIC_CONTACT_EMAIL`) and social links. No phone number, home address or anything from the CV beyond what the brief approves.
4. **Public repository.** Never commit secrets, API keys, `.env` files, real visitor data or private material. Use `.env.example` with placeholders.
5. **Tokens only.** Colours, type sizes, spacing, radii, shadows and easing come from the design tokens. No hard-coded hex values or one-off font sizes in components.
6. **Quality bar is a requirement, not a wish.** WCAG 2.2 AA (axe clean in light and dark), keyboard operable, `prefers-reduced-motion` respected, no horizontal scroll at 375 px, page budgets in `scripts/check-budget.mjs` (home ≤ 600 KB). A change that breaks one doesn't merge.
7. **Feature flags.** Pages and delights ship behind flags (decision 0006). A flagged-off page returns 404 and disappears from navigation, ⌘K, the sitemap and assistant citations.
8. **Plain language for the owner.** When explaining options or decisions, say what each means in practice and give a clear recommendation.
9. **No dashes between words (decision 0014).** Never use an em dash, an en dash, or a spaced hyphen as punctuation in anything public: site copy, alt text, metadata, docs, code comments, commit messages, PR titles and descriptions, issues and review replies. Rewrite with a full stop, comma, colon, brackets or "to". Hyphenated words ("full-stack") are fine, and an en dash may sit directly between two digits in a range. `make check` runs `scripts/check-dashes.mjs`, and CI checks the PR title and description.

## How work flows (decision 0011)

This file is the single current rulebook for planning, building, reviewing, merging and dependencies.

| Step                                                                                 | Who                 | Model      |
| ------------------------------------------------------------------------------------ | ------------------- | ---------- |
| 1. Plan the feature (issue plan + acceptance criteria)                               | Planner agent       | Opus 5.5   |
| 2. Build each task                                                                   | Implementer agent   | Sonnet 5.5 |
| 3. Run `make check` (+ `make e2e` and `make shots` for UI) and map criteria to tests | Verifier agent      | Sonnet 5.5 |
| 4. Pre-push review (fresh context, "When reviewing")                                 | Reviewer agent      | Opus 5.5   |
| 4a. Instead of step 4 for owner-only PRs and stage-gate reviews (decision 0015)      | Deep reviewer agent | Fable 5.1  |
| 5. Open the pull request; Codex reviews the latest commit                            | Codex               | n/a        |
| 6. Handle review comments                                                            | Review handler      | Opus 5.5   |
| 7. Merge when the conditions below are met; post a one-line summary                  | Claude Code         | n/a        |

Project agents are in `.claude/agents/`; permission rules are in `.claude/settings.json`.

### Reviewing the model roster

The roster above follows the Claude models available today. **Whenever Anthropic releases a new Claude model**, open an issue labelled `decision` and review it against this table:

1. Read the model's announcement and migration notes: capabilities, price per million tokens, speed, context size, and any breaking API changes.
2. For each row (planner, implementer, verifier, reviewer, deep reviewer), decide whether the new model should take it, considering quality, cost and speed. Try it on one real task before switching.
3. Check the site's own model use too (the Ask Sunkanmi assistant, decision 0009) against its evaluation set before changing it.
4. Record the outcome in a decision record (or a line in the register if nothing changes), then update this table, `.claude/agents/`, decision 0015 and `docs/references/third-party.md` in one pull request.

## Planning

- **Every feature gets a plan** in its GitHub issue before building (use the "Build task" template). Small changes get a short plan.
- The plan names components created or reused, the data contract (Supabase table/columns, TypeScript types) where there is one, the feature flag, and acceptance criteria, each with the test that proves it (unit, e2e, axe, budget), including mobile, keyboard and edge states.
- Hard-to-reverse choices get a decision record in `docs/decisions/`; easily reversible ones get one line in the register.

## When building (Claude Code)

- One issue per session, on a branch named `type/short-description` (e.g. `feat/hero-slice`). Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- Start from the issue's plan. If it is unclear or conflicts with a decision or the brief, stop and ask rather than guess.
- Small vertical slices: structure, style, interaction and tests together. Write tests for behaviour (Vitest + Testing Library for components, Playwright + axe for pages).
- **Noticed, not changed:** list anything outside the task in the PR description and open an issue labelled `noticed` for each. Don't fix unrelated things in the same change.
- **Stop and ask** when a task needs an undecided product or content choice, a package not on the pre-approved list (decision 0012), or work well beyond the issue. **Stop after 3 failed attempts** at the same problem and report what was tried.
- **Stop what you start:** dev servers, watchers, temporary worktrees.
- Before using a framework API, check the official documentation for the pinned version (`docs/references/third-party.md`; for Next.js read `node_modules/next/dist/docs/`), not memory. When adding a dependency or changing a major version, update that file in the same PR.
- Commit messages and PR titles: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`. Squash merges use the PR title.
- PR description: use the template (what and why, how tested, assumptions, claims and content, pre-flight check, noticed-not-changed).
- **Pre-flight check:** search the repository for every term, decision ID, token and figure the change touches, and fix any contradiction or stale statement in the same PR. Check new facts against their sources.
- **Run `make check` before pushing**, and `make e2e` for any UI change.
- **Visual review for any UI change.** Tests prove behaviour, not taste. Run `make build && make shots`, then look at every screenshot in `.artifacts/screenshots/` (each route, light and dark, 360, 768 and 1440 px) and judge it against the brief's quality bar, not just "nothing is broken". Check the small things a visitor notices:
  - **Both themes equally finished:** edges, outlines, notches and shadows read as clearly in light as in dark.
  - **Text:** no orphan words, split figures or names ("2025 / R4"), links separated from their icons, or labels touching their container's edge.
  - **Layout:** alignment between neighbouring elements, even spacing, nothing squeezed or wrapping at 360 px.
  - **Content:** nothing repeated from elsewhere on the page, headings that fit the voice around them, every element earning its place.
  - **Polish:** if a section looks merely acceptable, propose a better design to the owner instead of shipping it (the footer redesign in #48 is the standard).
    Fix what you find in the same PR, and list what you checked under "How tested".
  - **Automatic backstop:** the `visual regression` CI job compares full-page screenshots (home and one coming soon page, five viewports, both themes) with Linux baselines in `e2e/__screenshots__/`. Run `make visual` to try it locally (local macOS images are git-ignored and never match CI). If the job fails, open its `visual-diffs` artifact and judge every diff by eye. If the change is intended, run `make visual-accept RUN=<run id>` to download the proposed baselines, check them against the checklist above, and commit them. Never accept a diff you have not looked at.
- **Pre-push review:** run the reviewer agent (fresh context) and fix its findings first. For owner-only PRs (infrastructure, deploy, CI permissions, security, running costs) and stage-gate or pre-launch reviews, run the deep reviewer (Fable 5.1) instead (decision 0015).
- Ask the owner before installing packages not on the pre-approved list, changing infrastructure, hosting, Supabase projects, model spend, or repository settings. **Never push to `main`.**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Teach as you build

- **Feature** PRs include **"How it works"** (plain language) and **"Concepts to learn"** (links to official documentation for what the change uses). Docs, chore and dependency PRs don't need them.
- When the owner asks why, answer in plain language with a small example and a link to the official source.

## When reviewing (pre-push reviewer, Codex, fallback)

Check in priority order:

1. **Correctness:** bugs, wrong logic, unhandled states (loading, empty, error, flag off, JavaScript off where it matters).
2. **Breaches of the rules above**, especially the claims policy, employer confidentiality, personal data and tokens-only.
3. **Spec match:** the issue's acceptance criteria and the design brief, including 375 px, keyboard, focus, reduced motion, and light and dark themes looking equally finished (see "Visual review" under "When building").
4. **Quality bar:** accessibility (contrast, names, landmarks, focus order), performance (budgets, image sizes, client JS added), SEO (metadata, one `h1`).
5. **Tests:** important behaviour and edge states covered.
6. **Clarity:** could the owner understand and maintain this? Flag unnecessary complexity.

How to report:

- Most serious first. For each: file and line, what's wrong, a concrete failure example, and a suggested fix.
- Severity: **P0/P1** (wrong behaviour or content, false or unsourced claim, accessibility or security problem, broken rules above) or **P2/P3** (wording, consistency, polish). Say "no issues found" if there are none.
- **First review: one complete pass**, including knock-on effects elsewhere in the repository. **Re-reviews: fixes only** (new P2/P3 only on changed lines; P0/P1 anywhere).
- Reviewers don't push commits or approve merges.

## When merging (Claude Code)

Claude Code may squash-merge a PR only when **all** of these are true:

1. **Codex has reviewed the latest commit.** Exceptions: Dependabot minor/patch updates with all checks green; and if Codex is unavailable for over 24 hours, a fallback review by the reviewer agent posted as one PR comment headed "Fallback review (Codex unavailable)" (documentation-only PRs, or with the owner's agreement).
2. Every finding is fixed, answered with a reason, or deferred under "Review rounds"; every review thread is resolved.
3. Every check has passed (none failing, none running), whether or not GitHub marks it required.
4. **Zero GitHub security alerts** added by the PR. While an alert is open on `main`, only fixes or documentation-only PRs merge.
5. The PR isn't on the owner-only list below.

**The owner merges these:**

- `LICENSE`, repository settings, CI permissions, `.claude/settings.json`, or these merge rules.
- Changes to the claims policy or to how an employer is described publicly.
- Infrastructure, hosting, Supabase project settings, model spend caps, or anything that changes running costs.
- A package not on the pre-approved list (decision 0012).
- Any PR where Claude Code disputes a finding as wrong (not merely defers it).

P0/P1 findings always block. After merging, post a one-line summary for the owner: what merged, and any follow-up issues created.

## Review rounds and debt

- **P0/P1 always block.** Fix them in the PR, in any round.
- **P2/P3 are fixed in rounds 1 and 2.** From round 3, open a `review-followup` issue, link it in the reply and resolve the thread. If unsure of a severity, treat it as P1.
- **One re-review per batch of fixes:** fix every open finding, push once, request one re-review.
- **Debt limit:** more than 5 open `review-followup` issues pauses feature work. `noticed` issues are triaged weekly.

## Keeping agent cost down

- Opus 5.5 plans and reviews; Sonnet 5.5 does everything else. Fable 5.1 costs 2.5 times Opus per token and a hard review can run for minutes, so use it only where decision 0015 says; never for routine feature PRs, building, or the live site's assistant.
- Keep PRs focused on one topic; group small related documentation changes.
- Read only the files a task needs.
- Run `make check` and the pre-push review before pushing, so Codex rounds are rare.
- Wait for reviews and checks in the background with long intervals; don't poll.
- Before a long or expensive task (model calls, large media processing), say so and suggest a cheaper route if there is one.

## Commands

Run from the repository root. Needs Node 24 (`.nvmrc`) and pnpm via Corepack (`corepack enable`).

| Command                                   | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make check`                              | Everything CI's `make check` job runs, in order: `install` (frozen lockfile), `lint` (ESLint, zero warnings), `dashes` (no dashes between words, decision 0014), `format-check` (Prettier), `typecheck` (Next route types + strict `tsc`), `coverage` (Vitest with coverage in `.artifacts/coverage/`), `build` (production), `budget` (page transfer budgets). Run before pushing. |
| `make e2e`                                | Playwright journeys + axe accessibility in desktop-light, desktop-dark and mobile, against a production build. Run `make build` first; `make e2e-install` once for the browser.                                                                                                                                                                                                     |
| `make visual`                             | Screenshot comparison (`@visual` tests) against the Linux baselines in `e2e/__screenshots__/`. Run `make build` first. CI runs it in the pinned Playwright container; local runs are only a smoke test. `make e2e` excludes these tests.                                                                                                                                            |
| `make visual-accept RUN=<id>`             | Download the `visual-baselines` artifact of a failed CI run into `e2e/__screenshots__/`, ready to review and commit.                                                                                                                                                                                                                                                                |
| `make shots`                              | Full-page screenshots of every route in light and dark at 360, 768 and 1440 px into `.artifacts/screenshots/`, for the visual review. Run `make build` first. `SHOTS_BASE_URL=https://staging.olaheavy.dev` shoots staging instead.                                                                                                                                                 |
| `make test`                               | Unit and component tests only.                                                                                                                                                                                                                                                                                                                                                      |
| `make format`                             | Rewrite files with Prettier.                                                                                                                                                                                                                                                                                                                                                        |
| `make docker-build` / `make docker-check` | Build the production image locally and check it for private files and a root user (see `docs/deploy.md`).                                                                                                                                                                                                                                                                           |
| `make clean`                              | Remove build and test output.                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm dev`                                | Local development server.                                                                                                                                                                                                                                                                                                                                                           |
