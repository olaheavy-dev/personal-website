# 0012: Dependencies and pre-approved packages

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

Packages add risk, weight and licence obligations; agents need to know what they may add without asking.

## Options

- Ask for every package
- Pre-approved list

## Decision

Pre-approved (add without asking, exact versions): `next`, `react`, `react-dom`, `typescript`, `tailwindcss` and `@tailwindcss/*`, `eslint` and `eslint-config-next`, `prettier` and `prettier-plugin-tailwindcss`, `vitest` and `@vitest/*`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*`, `@playwright/test`, `@axe-core/playwright`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `@anthropic-ai/sdk`, `langchain`, `@langchain/core`, `@langchain/anthropic`, `@langchain/community`, `langsmith` (decision 0016), `three`, `@react-three/fiber`, `@react-three/drei`, `shiki`, and `@types/*` for these. Anything else needs the owner.

## Consequences

- Dependency review fails a PR on any vulnerability or a non-permissive licence.
- Adding a package updates `docs/references/third-party.md` in the same PR.
- Recorded licence exception (2026-10-24): `sharp`'s prebuilt libvips packages (`@img/sharp-libvips-*`, `@img/sharp-wasm32`, `@img/sharp-win32-*`) are LGPL-3.0-or-later. Next.js installs them for image optimisation; they are used unmodified and dynamically linked, which the LGPL permits. They are listed by name in `dependency-review.yml`; any other LGPL package still fails review.
- Held back on purpose (2026-10-24, `.github/dependabot.yml`): major updates of the `node` base image and `@types/node` (the site runs Node 24, the LTS line), and TypeScript 7 (not yet supported by `typescript-eslint`). Revisit when Node 26 becomes LTS and when `typescript-eslint` supports TypeScript 7.
- Held back on purpose (2026-10-25, owner): ESLint 10. `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import` (bundled by `eslint-config-next`) do not yet declare ESLint 10 support; Dependabot ignores the major. Revisit when they do.
