# 0010: Private source material stays local

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The repository is public. The owner's CV (with phone number), portraits, logos and research notes are needed to write content but must not be published.

## Options

- Keep local, git-ignored
- Commit research only
- Make the repository private

## Decision

`supporting-documents/` and `.local/` are git-ignored. Only intentional, optimised assets are committed under `public/`.

## Consequences

- Agents may read the folder but never commit from it; `.claude/settings.json` denies `git add` on it.
