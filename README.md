# olaheavy.dev

The personal site of **Sunkanmi Olawuwo** — full-stack and AI engineer. _I take products from idea to production — with AI built in._

Built with Next.js 16, TypeScript and Tailwind CSS v4, backed by Supabase, and deployed to my own VPS. The design process (brief, information architecture, tokens, tasks) lives in [`.design/portfolio/`](.design/portfolio/); decisions in [`docs/decisions/`](docs/decisions/README.md); how work is done in [`AGENTS.md`](AGENTS.md).

## Status

In development. Progress is tracked in GitHub issues, one per task in [`.design/portfolio/TASKS.md`](.design/portfolio/TASKS.md).

## Run it locally

Needs Node 24 and pnpm (`corepack enable`).

```bash
make install            # dependencies, exactly as locked
cp .env.example .env.local
pnpm dev                # http://localhost:3000
```

## Checks

```bash
make check              # lint, format, types, unit tests + coverage, build, page budgets
make e2e-install        # once: Playwright browser
make build && make e2e  # browser journeys + axe accessibility (light, dark, mobile)
```

Every pull request runs the same checks in CI, plus dependency review, actionlint and zizmor. `main` is protected; changes land through reviewed, squash-merged pull requests.

## Licence

Public for portfolio purposes; all rights reserved. See [`LICENSE`](LICENSE).
