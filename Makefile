# Every automated check runs through this file, locally and in CI.
# Requires Node 24 (see .nvmrc) and pnpm via Corepack (`corepack enable`).

.DEFAULT_GOAL := help
export NEXT_TELEMETRY_DISABLED := 1

.PHONY: help install check lint dashes format format-check typecheck test coverage build budget e2e e2e-install visual visual-accept shots docker-build docker-check db-start db-reset db-test db-lint db-types db-check db-stop clean

help: ## List the available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

install: ## Install dependencies exactly as locked
	pnpm install --frozen-lockfile

check: install lint dashes format-check typecheck coverage build budget client-secrets ## Every gate CI runs on a pull request (except e2e)

lint: ## ESLint, zero warnings allowed
	pnpm lint

dashes: ## Fail on dashes used between words in any public text (decision 0014)
	node scripts/check-dashes.mjs

format: ## Rewrite files with Prettier
	pnpm format

format-check: ## Fail if any file is not Prettier-formatted
	pnpm format:check

typecheck: ## Generate route types, then strict TypeScript
	pnpm typecheck

test: ## Unit and component tests (Vitest)
	pnpm test

coverage: ## Unit tests with coverage report in .artifacts/coverage
	pnpm test:coverage

build: ## Production build
	pnpm build

budget: ## Fail if a page exceeds its transfer budget (after build)
	pnpm budget

client-secrets: ## Fail if a server secret could reach the browser (after build)
	node scripts/check-client-secrets.mjs

e2e-install: ## Install the Playwright browser once
	pnpm exec playwright install --with-deps chromium

e2e: ## Browser journeys + axe accessibility against a production build
	pnpm test:e2e --grep-invert @visual

visual: ## Screenshot comparison against the Linux baselines (after build; CI runs it in the Playwright container)
	pnpm test:e2e --grep @visual

visual-accept: ## Download the proposed baselines from a failed CI run: make visual-accept RUN=<run id>
	@test -n "$(RUN)" || { echo "Usage: make visual-accept RUN=<run id>"; exit 1; }
	rm -rf .artifacts/visual-baselines
	gh run download $(RUN) --repo olaheavy-dev/personal-website -n visual-baselines -D .artifacts/visual-baselines
	cp .artifacts/visual-baselines/*.png e2e/__screenshots__/
	@git status --short e2e/__screenshots__

shots: ## Full-page screenshots of every route, light and dark, at 360, 768 and 1440 px (after build)
	node scripts/screenshots.mjs

docker-build: ## Build the production image locally as personal-website:local (uses NEXT_PUBLIC_SUPABASE_* from your shell if set, else a smoke build with no Supabase)
	@if [ -n "$$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then \
		docker build --build-arg BUILD_SHA=$$(git rev-parse HEAD) \
			--build-arg NEXT_PUBLIC_SUPABASE_URL --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
			-t personal-website:local .; \
	else \
		echo "docker-build: no Supabase values in the shell, so this is a local smoke build (SUPABASE_OPTIONAL=1). Never publish it."; \
		docker build --build-arg BUILD_SHA=$$(git rev-parse HEAD) --build-arg SUPABASE_OPTIONAL=1 \
			-t personal-website:local .; \
	fi

docker-check: ## Check the local image for private files and a root user
	bash scripts/check-image.sh personal-website:local

# The database targets need Docker. db-start runs Postgres only (no API, auth or studio),
# which is all the schema tests need. See docs/database.md.
db-start: ## Start the local Postgres in Docker (Postgres only)
	pnpm exec supabase start -x gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor

db-reset: ## Rebuild the local database from the migrations and the seed
	pnpm exec supabase db reset

db-test: ## pgTAP tests in supabase/tests
	pnpm exec supabase test db

db-lint: ## Lint the local schema (warnings fail)
	pnpm exec supabase db lint --local --fail-on warning

db-types: ## Regenerate src/lib/db/database.types.ts from the local database
	pnpm exec supabase gen types typescript --local > src/lib/db/database.types.ts
	pnpm exec prettier --write src/lib/db/database.types.ts

db-check: db-start db-reset db-test db-lint ## Database gate: reset, pgTAP tests, lint, and generated types up to date
	mkdir -p .artifacts
	cp src/lib/db/database.types.ts .artifacts/database.types.committed.ts
	$(MAKE) db-types
	diff -u .artifacts/database.types.committed.ts src/lib/db/database.types.ts || { echo "database.types.ts is out of date: run make db-types and commit it"; exit 1; }

db-stop: ## Stop the local database containers
	pnpm exec supabase stop

clean: ## Remove build and test output
	rm -rf .next .artifacts coverage playwright-report test-results
