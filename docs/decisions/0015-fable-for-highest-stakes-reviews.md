# 0015: Fable 5.1 for the highest-stakes reviews

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner

## Context

Claude Fable 5.1 is Anthropic's most capable widely released model, for the hardest reasoning and long-horizon work. It costs $10 / $50 per million input and output tokens (Opus 5.5: $4 / $20; Sonnet 5.5: $2 / $10; Haiku 5.5: $0.10 / $0.50), and a hard request can run for several minutes. During the deploy work, a read-only Terraform plan would have replaced two live DNS records; only a guard caught it. That is the kind of change where the strongest review pays for itself.

## Options

- Fable for every review
- Fable only where a missed problem is most expensive
- Not used

## Decision

Fable 5.1 runs the pre-push review (the `deep-reviewer` agent) for owner-only pull requests (infrastructure, deploy, CI permissions, security, Terraform and DNS, running costs) and for stage-gate or pre-launch whole-site reviews, including the design review. It may also help plan the hardest features (the Ask Sunkanmi assistant and its evaluation set, the admin media pipeline). Everything else keeps the existing roster: Opus 5.5 plans and reviews, Sonnet 5.5 builds and verifies, Codex reviews every pull request.

## Consequences

- The live site's Ask Sunkanmi assistant does not run on Fable: per-question cost and latency matter there; its model is chosen against its evaluation set (decision 0009).
- Codex stays the independent second reviewer on every pull request.
- If a Fable review blocks an owner-only change, the owner decides, as for any disputed finding.
- This choice is revisited whenever Anthropic releases a new Claude model, following "Reviewing the model roster" in `AGENTS.md`.
