# Documentation index

## Folder structure

```
.design/portfolio/       design-flow outputs: brief, information architecture, tokens, tasks, reviews
docs/
├── README.md            this index
├── decisions/           one record per decision, plus the register
└── references/          pinned versions and official documentation links
AGENTS.md                the rulebook for how work is done (CLAUDE.md links to it)
```

`supporting-documents/` is the owner's private source material (CV, portraits, research). It is git-ignored and never committed (decision 0010).

## What each document is for

| Document                                                                     | Owns                                                                                   | Status  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------- |
| [Design brief](../.design/portfolio/DESIGN_BRIEF.md)                         | Problem, positioning, experience principles, aesthetic, **claims policy**, quality bar | Current |
| [Information architecture](../.design/portfolio/INFORMATION_ARCHITECTURE.md) | Site map, URLs, navigation, content order, flags, naming                               | Current |
| [Design tokens](../.design/portfolio/DESIGN_TOKENS.css)                      | Colours, type, spacing, motion (live copy in `src/styles/tokens.css`)                  | Current |
| [Build tasks](../.design/portfolio/TASKS.md)                                 | Ordered build checklist; each task becomes an issue                                    | Current |
| [Decision register](decisions/README.md)                                     | Every decision's status and record                                                     | Current |
| [Third-party references](references/third-party.md)                          | Pinned versions and official docs                                                      | Current |
| [Deploy runbook](deploy.md)                                                  | How a merge reaches staging, rollback, local image checks                              | Current |
| [AGENTS.md](../AGENTS.md)                                                    | Planning, building, reviewing, merging, dependencies                                   | Current |

Accepted decision records override anything in other documents that contradicts them. For process, `AGENTS.md` is the single current rulebook (decision 0011).
