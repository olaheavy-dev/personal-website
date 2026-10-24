# Every automated check runs through this file, locally and in CI.
# Requires Node 24 (see .nvmrc) and pnpm via Corepack (`corepack enable`).

.DEFAULT_GOAL := help
export NEXT_TELEMETRY_DISABLED := 1

.PHONY: help install check lint dashes format format-check typecheck test coverage build budget e2e e2e-install shots docker-build docker-check clean

help: ## List the available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

install: ## Install dependencies exactly as locked
	pnpm install --frozen-lockfile

check: install lint dashes format-check typecheck coverage build budget ## Every gate CI runs on a pull request (except e2e)

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

e2e-install: ## Install the Playwright browser once
	pnpm exec playwright install --with-deps chromium

e2e: ## Browser journeys + axe accessibility against a production build
	pnpm test:e2e

shots: ## Full-page screenshots of every route, light and dark, at 360, 768 and 1440 px (after build)
	node scripts/screenshots.mjs

docker-build: ## Build the production image locally as personal-website:local
	docker build --build-arg BUILD_SHA=$$(git rev-parse HEAD) -t personal-website:local .

docker-check: ## Check the local image for private files and a root user
	bash scripts/check-image.sh personal-website:local

clean: ## Remove build and test output
	rm -rf .next .artifacts coverage playwright-report test-results
