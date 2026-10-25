# 0016: LangChain and LangSmith for the assistant

**Status:** Accepted  
**Date:** 2026-10-25  
**Decided by:** the owner

## Context

Decision 0009 planned the Ask Sunkanmi assistant on the plain Anthropic SDK with no framework. The owner prefers a well structured, familiar framework for maintainability, one that shows tools he uses or will use at work, keeps running costs low and works with Supabase.

## Options

- Plain `@anthropic-ai/sdk` (decision 0009 as written)
- Vercel AI SDK with search in Postgres
- LangChain.js with LangSmith, inside the Next.js app
- Microsoft Agent Framework with Azure AI Foundry, as a separate Python or .NET service
- LangChain for Python, as a separate service

## Decision

The assistant uses **LangChain.js** inside the existing Next.js app, with **LangSmith** for traces and evaluations, the **Supabase pgvector** store for retrieval, and **Claude** as the answering model through LangChain's Anthropic integration.

Everything else in decision 0009 stands: grounded answers with citations that deep-link to section anchors, third-person voice, scope and prompt-injection guards, per-IP rate limit, monthly spend cap, and an evaluation set run in CI.

## Consequences

- No new service or hosting: the assistant runs in the same Docker image on the VPS (decision 0003).
- LangSmith starts on its free tier. Moving to a paid plan is a running cost, so it is an owner decision.
- Traces sent to LangSmith must not contain visitor personal data beyond the question text; the plan for #18 says what is logged and for how long.
- The embeddings provider and reranker are still open. Claude does not produce embeddings, so the plan for #18 recommends one (a provider through LangChain, or Supabase's built-in embedding model) and tests it against the evaluation set before the owner decides.
- Microsoft Agent Framework with Foundry stays a candidate for a later Lab project, where an agent use case would justify a separate service.
- Pre-approved packages in decision 0012 gain `langchain`, `@langchain/core`, `@langchain/anthropic`, `@langchain/community` and `langsmith`. `docs/references/third-party.md` is updated when they are first installed.
