# 0013: Quality gate

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The site must beat seven inspiration sites on speed and accessibility, and the repository is itself portfolio evidence.

## Options

- Strict from day one
- Lean now, tighten later
- Mirror Foresight

## Decision

`make check` (frozen install, ESLint zero warnings, Prettier, strict TypeScript, Vitest with coverage, production build, page budgets) and `make e2e` (Playwright + axe in light, dark and mobile) both required on `main`, plus dependency review, actionlint and zizmor. Lighthouse CI joins in the performance task.

## Consequences

- Home budget 600 KB initial transfer (`scripts/check-budget.mjs`).
- Branch protection requires the checks and resolved conversations; force pushes and deletions are blocked; squash merge only.
