# 0008: Writing via Hashnode

**Status:** Accepted  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The owner writes on Hashnode and wants posts on the site in its own design.

## Options

- Read and render natively
- Write in admin, publish to Hashnode
- Hashnode headless starter
- Link out only

## Decision

Hashnode stays the editor; the site reads posts via Hashnode's GraphQL API and renders them at `/writing/<slug>`, canonical to olaheavy.dev, revalidated by a signature-verified webhook.

## Consequences

- The admin shows sync status and a manual resync.
