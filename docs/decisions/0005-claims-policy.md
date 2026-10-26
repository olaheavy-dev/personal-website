# 0005: Claims policy

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

Most CV figures have no public source, some conflict with public data, and employers' internal work is confidential. A portfolio that overclaims loses trust.

## Options

- Use CV numbers as written
- Public facts only
- Use numbers, precisely worded and sourced

## Decision

Every number on the site carries a source (public link, repository link, or "own measurement"). The per-company table in `.design/portfolio/DESIGN_BRIEF.md` is binding: HBK names only Aiana publicly (later features described generically; no internals); Access QuickBucks shows only 1M+ Google Play downloads; Stanbic EZ Cash shows no number; Optty uses public figures, and the source link carries the date; uLesson shows no figures, like Stanbic IBTC (owner decision, 25 Oct 2026, replacing the two figures the table once held); Galooli's ~11% is attributed to Galooli; Mukuru shows only the company's public "17M+ customers served" (Techzim, linked) and never implies the 2024 Malawi wallet launch; RagLab is not shown as personal work.

## Consequences

- Reviewers treat an unsourced or policy-breaking claim as P1.
- Changes to this policy are owner-merged.

Owner decision, 26 Oct 2026: figure credits show no year, for example "(Optty)" and not "(Optty, 2023)"; the linked source carries the date. Each figure on the site is itself the link to its source. The stored `as_of_year` and `checked_on` stay in the data. HBK's AI work may be described as "AI agents for features like Python code suggestions and file data analysis", still without internals.
