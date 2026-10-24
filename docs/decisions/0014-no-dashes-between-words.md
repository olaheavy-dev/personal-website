# 0014: No dashes between words

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner

## Context

Em dashes and spaced dashes between words read as machine-written text. The site, the repository and its pull requests are all public and are part of the owner's portfolio, so the writing everywhere should read as his own.

## Options

- Everything public, enforced in CI
- Site copy only, enforced in CI
- Site copy enforced, other writing cleaned up gradually

## Decision

Everything public. No em dash, en dash or spaced hyphen used as punctuation between words in site copy, alt text, metadata, docs, code comments, commit messages, PR titles and descriptions, issues and review replies. Rewrite with a full stop, comma, colon, brackets or "to". Hyphenated words ("full-stack") are fine, and an en dash may sit directly between two digits in a range.

## Consequences

- `scripts/check-dashes.mjs` runs in `make check` over every tracked text file (Markdown inline code and code blocks are skipped). CI also checks the PR title and description, and re-runs when they are edited, because the squash commit message on `main` is built from them.
- The Next.js block in `AGENTS.md` between the `nextjs-agent-rules` markers is skipped: `next dev` regenerates that text, so editing it would only leave the working tree dirty.
- Commit history from before this decision keeps its original wording.
- Existing docs, comments and site copy were rewritten by hand in the pull request that introduced this rule.
