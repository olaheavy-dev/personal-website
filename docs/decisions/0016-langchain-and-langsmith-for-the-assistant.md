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
- Model choice is reviewed when OpenAI releases a model worth trying: run the evaluation set against it before switching.
- Microsoft Agent Framework with Azure AI Foundry, as a separate Python or .NET service
- LangChain for Python, as a separate service

## Decision

The assistant uses **LangChain.js** inside the existing Next.js app, with **LangSmith** for traces and evaluations, the **Supabase pgvector** store for retrieval, and **Voyage AI** (`voyage-4-lite`) for embeddings.

The answering model is an **OpenAI** model, through LangChain's OpenAI integration (owner's choice, 25 Oct 2026; Anthropic is not used for the assistant). Which OpenAI model is chosen by evidence: the evaluation set runs against candidates taken from OpenAI's current documentation (for example a small and a mid size model), and the winner is picked on groundedness, citation accuracy, refusals, first token latency and cost. Answers tag their sources, and our code accepts only tags that match a retrieved passage before a citation is shown.

Owner choices for the plan in #18 (25 Oct 2026): reranker built behind a switch and off at first; spend cap of $10 a month in the app plus a $15 limit on the OpenAI project, with a separate limit for CI evaluations; LangSmith traces kept 14 days with emails and phone numbers removed, Supabase metrics only (no question text, no IP) kept 90 days; rate limits of 5 questions per visitor per 10 minutes, 15 per day and 500 a day across the site; the assistant is done when the evaluation passes on all four case studies (HBK, Optty, Access Bank, Foresight).

Everything else in decision 0009 stands, except that the answering model is OpenAI rather than Claude: grounded answers with citations that deep-link to section anchors, third-person voice, scope and prompt-injection guards, per-IP rate limit, monthly spend cap, and an evaluation set run in CI.

## Consequences

- No new service or hosting: the assistant runs in the same Docker image on the VPS (decision 0003).
- LangSmith starts on its free tier. Moving to a paid plan is a running cost, so it is an owner decision.
- New keys the owner creates: Voyage (through MongoDB Atlas), OpenAI in a dedicated project with a spend limit (and a separate one for CI evaluations), and LangSmith (EU region).
- Traces sent to LangSmith must not contain visitor personal data beyond the question text; the plan for #18 says what is logged and for how long.
- Microsoft Agent Framework with Foundry stays a candidate for a later Lab project, where an agent use case would justify a separate service.
- Pre-approved packages in decision 0012 gain `langchain`, `@langchain/core`, `@langchain/community`, `@langchain/textsplitters`, `@langchain/openai` and `langsmith`. `@langchain/anthropic` is not added, since the assistant does not use Claude. `server-only` is not added; an ESLint rule keeps assistant code out of client bundles. `docs/references/third-party.md` is updated when they are first installed.
