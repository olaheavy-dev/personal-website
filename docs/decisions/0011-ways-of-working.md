# 0011: Ways of working

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The owner's other projects use an agent roster, structured reviews and merge rules that work well.

## Options

- Reuse HomeScout's roster
- Roster, owner merges everything
- Single agent + Codex

## Decision

Reuse HomeScout's model: Opus plans and reviews, Sonnet builds and verifies, Codex reviews every PR, Claude Code squash-merges when every condition in `AGENTS.md` holds; owner-only merges for settings, claims policy, infrastructure, cost and new packages. GitHub issues track tasks; feature PRs include "How it works" and "Concepts to learn".

## Consequences

- `AGENTS.md` is the single current rulebook for process.
- Branches are `type/short-description`; `main` is protected.
