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
- Running-cost changes are owner-merged.
