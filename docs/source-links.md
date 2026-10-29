# Source link checker

Every external source the site shows must stay valid (claims policy, decision 0005). A weekly workflow checks them and keeps one GitHub issue up to date. Issue #127. This is the checker only: it does not store phrases or archive addresses and the site does not yet link to archived copies (later pull requests).

## What it does

`.github/workflows/source-links.yml` runs `scripts/check-source-links.mjs` on Mondays at 07:23 UTC, and on demand (Actions tab, "Source links", Run workflow).

1. Reads the published sources from the hosted database with the publishable key, as the site does: outcome links, each stop's detail sources, and Lab project links. The HBK release notes link, which lives in code, comes from `STATIC_SOURCES` in the script. A test fails if a new hard-coded source URL appears in `src` without being listed there.
2. Requests each URL: one at a time, at least 2 seconds between requests to one host, three attempts (2 s then 8 s backoff, `Retry-After` honoured up to 30 s), with an honest user agent that names this repository.
3. Saves claim sources (not Lab links) to the Internet Archive when no snapshot newer than 180 days exists. Saves are 25 seconds apart, at most 10 a run. A failed save is listed, never counted as broken.
4. Opens, updates or closes one issue titled **Source links: weekly check**, labelled `links`.

## What the results mean

| Result              | When                                             | What to do                                                                                                                  |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Broken              | 404, 410, DNS failure, or a 5xx on every attempt | Find another public source or the new location. Wording changes need the owner's approval; it ships as a content migration. |
| Could not verify    | 401, 403, 429, other 4xx, or errors that persist | Open the link by hand. Many publishers block automated requests; this is not a failure of the source.                       |
| Archive save failed | The Internet Archive refused or timed out        | Usually transient. Retried next week.                                                                                       |
| Moved               | The final host differs                           | A note. Update the stored link when convenient.                                                                             |

## The issue

| Situation                                 | Action                                                    |
| ----------------------------------------- | --------------------------------------------------------- |
| Problems and no open issue                | Create it                                                 |
| Same problems as last week                | Update the description only                               |
| Problems changed                          | Update the description and comment                        |
| Clean and an open issue                   | Comment and close                                         |
| Database read failed, or no sources found | Change nothing, and the run fails so the owner is emailed |

The `links` label must exist (it does). The workflow token has `contents: read` and `issues: write` only, and no label rights.

## Running it locally

```
SUPABASE_URL=... SUPABASE_KEY=<publishable key> node scripts/check-source-links.mjs --dry-run
```

`--dry-run` prints the issue body and changes nothing on GitHub. It still contacts the sources and the Internet Archive, so use it sparingly.

## Limits to know

- The Internet Archive's official Save Page Now 2 document says the API needs an account key and gives anonymous limits (6 concurrent, 4,000 a day, 10 saves of one URL a day). The checker uses the plain anonymous `GET /save/<url>`, spaced far below those limits. If the Archive refuses anonymous saves, the issue lists them under "Archive save failed" and nothing else breaks.
- GitHub disables scheduled workflows on a public repository after 60 days without activity. Re-enable it from the Actions tab.

## Tests

`scripts/check-source-links.test.ts` (classification, retries, throttle, archive rules, issue body and actions), `scripts/source-links-static.test.ts` (hard-coded URLs), `scripts/source-links-workflow.test.ts` (permissions, pins, no `${{` in `run`). No test calls the Internet Archive or GitHub.
