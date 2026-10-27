#!/usr/bin/env bash
# The cold start journey (make e2e-cold, and the e2e job in CI, which has no make).
# A cold start with every flagged page Off at build time. It builds on its own (the pages must be
# baked Off, which needs the fake to start without them) and removes .next afterwards, so run
# `make build` again before the other e2e targets. Limit: it proves what the build wrote and a fresh
# server serves. It stops first if port 54329 (the fake) or 3210 (the site) is taken, because a
# leftover server would be reused and the test would pass or fail against the wrong build. A failed
# build leaves a partial .next behind; `make build` replaces it. It cannot prove a restart after a
# revalidation, because `pnpm serve` copies .next/server/app, where the running server writes rebuilt
# pages, back into the standalone folder.
set -u

# Uses bash's /dev/tcp, so it needs neither lsof nor nc (the Playwright image has neither).
for port in 54329 3210; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    echo "e2e-cold: port $port is in use. Stop that server first."
    exit 1
  fi
done

flags=page.work,page.lab,page.writing,page.travel,page.about
rm -rf .next
FAKE_FLAGS_OFF=$flags node e2e/fixtures/with-fake-supabase.mjs pnpm build || { status=$?; rm -rf .next; exit "$status"; }
FAKE_FLAGS_OFF=$flags pnpm test:e2e --grep @cold --workers=1 --project=desktop-light --project=small-phone
status=$?
rm -rf .next
exit "$status"
