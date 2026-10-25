# 0009: Ask Sunkanmi assistant

**Status:** Accepted (partly superseded by 0016: the assistant is built with LangChain.js and LangSmith rather than the plain Anthropic SDK, and the answering model is an OpenAI model chosen by evaluation, not Claude)  
**Date:** 2026-10-24  
**Decided by:** the owner, in the design-flow grill session

## Context

The site's signature should prove AI-to-production craft, not be a gimmick chatbot.

## Options

- Supabase pgvector + Claude
- Reuse Foresight's gateway
- Gemini / OpenAI
- Phase 2

## Decision

A grounded assistant: published content ingested into pgvector, hybrid search + rerank, Claude with citations that deep-link to section anchors, third-person voice, scope and prompt-injection guards, per-IP rate limit, monthly spend cap, traces, and an eval set run in CI.

## Consequences

- Never auto-opens; a "How this works" view shows sources, latency and cost.
- Spend caps are owner decisions.
