<!-- Title: conventional commit style, e.g. "feat: hero slice". It becomes the squash commit title. No dashes between words in the title or description (decision 0014); CI checks both. -->

Closes #

## What changed and why

## How it was tested

- [ ] `make check` passes locally
- [ ] `make e2e` passes locally (UI changes)
- [ ] If the `visual regression` job failed: reviewed every diff image, then accepted the new baselines with `make visual-accept RUN=<run id>` and committed them (UI changes)
- [ ] Visual review with `make shots`: every changed route at 360 / 768 / 1440 px, light and dark, against the checklist in AGENTS.md (UI changes)

## Assumptions made

## Claims and content

<!-- Any figure, company fact or employer statement added or changed: its source, and that it follows the claims policy (decision 0005). Write "None" if not applicable. -->

## Docs consulted

<!-- The official documentation this change relies on, for the pinned version: the page or file and the version, one per line, e.g. `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md` (Next 16.4.3) or https://supabase.com/docs/guides/database/webhooks. Include source code read when the docs were silent. List only pages you opened while making this change; "from memory" is not an entry. Write "None" only for changes that use no framework, package or platform behaviour. -->

## Pre-flight check

<!-- Terms, decision IDs, tokens and figures searched for; contradictions or stale statements fixed in this PR. -->

## Noticed, not changed

<!-- Anything outside this task, each with a `noticed` issue link. Write "Nothing" if none. -->

## How it works

<!-- Feature PRs only: plain-language explanation of how the change works. Delete for docs/chore/dependency PRs. -->

## Concepts to learn

<!-- Feature PRs only: links to the official documentation pages for what this change uses. Delete for docs/chore/dependency PRs. -->
