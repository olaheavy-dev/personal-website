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

Pre-approved (add without asking, exact versions): `next`, `react`, `react-dom`, `typescript`, `tailwindcss` and `@tailwindcss/*`, `eslint` and `eslint-config-next`, `prettier` and `prettier-plugin-tailwindcss`, `vitest` and `@vitest/*`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*`, `@playwright/test`, `@axe-core/playwright`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `@anthropic-ai/sdk`, `three`, `@react-three/fiber`, `@react-three/drei`, `shiki`, and `@types/*` for these. Anything else needs the owner.

## Consequences

- Dependency review fails a PR on any vulnerability or a non-permissive licence.
- Adding a package updates `docs/references/third-party.md` in the same PR.
