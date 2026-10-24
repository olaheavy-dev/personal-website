# 0006: Feature flags in Supabase

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

Every page and delight should ship dark and be switched on from the admin without a redeploy.

## Options

- Own flags in Supabase
- Vercel Flags / Edge Config
- Third-party flag service
- Build-time env flags

## Decision

A `feature_flags` table with three states (**On**, **Preview** for the owner only, and **Off**), read server-side with tag-based revalidation.

## Consequences

- Off and Preview pages return 404 to the public and disappear from navigation, ⌘K, the sitemap and assistant citations.
- `page.home` is locked on.
