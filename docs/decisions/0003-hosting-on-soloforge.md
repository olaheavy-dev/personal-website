# 0003: Hosting on the owner's SoloForge VPS

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The owner runs SoloForge, a single-VPS platform (Cloudflare → Caddy → Docker; GitHub Actions → GHCR → Watchtower; WireGuard for admin) that already hosts Foresight.

## Options

- Vercel
- SoloForge VPS

## Decision

Deploy as a Docker image (Next.js standalone) to SoloForge at **olaheavy.dev**, following the infra repository's new-project onboarding.

## Consequences

- This repository holds only public-safe deployment files; hostnames, IPs and credentials stay in the private infra repository and server-side `.env`.
- Images are tagged `sha-<commit>` and `main`; rollback uses the sha tag; a `/healthz` endpoint feeds the App Registry.
- Infrastructure changes are owner-merged.
- **Staging first (owner decision, 2026-10-24):** the site deploys to `staging.olaheavy.dev`, hidden from search engines by Caddy (`X-Robots-Tag: noindex` and a disallow-all `robots.txt`), until Home, Work and a case study are ready. The same image is then promoted to `olaheavy.dev` with one Caddy and DNS change.
- **Public image (owner decision, 2026-10-24):** `ghcr.io/olaheavy-dev/personal-website` is public, like Foresight's images. The publish workflow refuses any image that contains private files or runs as root (`scripts/check-image.sh`). The runbook is `docs/deploy.md`.
