# 0004: Hosted Supabase for data, auth and storage

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The site needs Postgres (content, flags, travel), vector search for the assistant, owner-only auth for the admin, and image storage with transforms.

## Options

- Hosted Supabase
- Self-hosted Supabase on the VPS
- Neon + R2 + Auth.js

## Decision

Hosted Supabase (Postgres + pgvector, Auth, Storage). Row-level security on every table: public reads of published rows only, owner writes.

## Consequences

- Migrations live in the repository.
- The service-role key is server-only and never reaches the browser.
- Update, 2026-10-25 (owner): the project uses the new API keys only. The server key is now the secret key (`SUPABASE_SECRET_KEY`, `sb_secret_`), and the browser key is the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_publishable_`). The legacy anon and service role keys are disabled after the first smoke test and the code refuses them. Everything else above is unchanged.
- Running-cost changes are owner-merged.
