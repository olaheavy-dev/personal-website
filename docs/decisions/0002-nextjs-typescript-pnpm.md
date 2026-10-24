# 0002: Next.js, TypeScript and pnpm

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The site needs server rendering for speed and SEO, an admin area, API routes for the assistant and webhooks, and a 3D page loaded on demand.

## Options

- Next.js + Postgres + R2
- Next.js + Supabase
- ASP.NET Core API + Next.js
- Astro + headless CMS

## Decision

Next.js 16 App Router with Cache Components, TypeScript strict, Tailwind CSS v4, pnpm (version pinned in `package.json`), Node 24.

## Consequences

- Read `node_modules/next/dist/docs/` before using a Next.js API, because this version differs from older habits.
- Exact versions are pinned (`.npmrc` `save-exact`); Dependabot proposes updates weekly with a 7-day cooldown.
