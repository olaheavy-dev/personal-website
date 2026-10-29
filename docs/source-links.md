# Source link checker

Every external source the site shows must stay valid (claims policy, decision 0005). A weekly workflow checks them and keeps one GitHub issue up to date. Issue #127. The database can store, per claim source, a phrase to look for and an archive copy (see "Phrases and archive copies"). The site does not yet link to archived copies (a later pull request).

## What it does

`.github/workflows/source-links.yml` runs `scripts/check-source-links.mjs` on Mondays at 07:23 UTC, and on demand (Actions tab, "Source links", Run workflow).

1. Reads the published sources from the hosted database with the publishable key, as the site does: outcome links, each stop's detail sources, and Lab project links. The HBK release notes link, which lives in code, comes from `STATIC_SOURCES` in the script. A test fails if a new hard-coded source URL appears in `src` without being listed there.
2. Requests each URL: one at a time, at least 2 seconds between requests to one host, three attempts (2 s then 8 s backoff, `Retry-After` honoured up to 30 s), with an honest user agent that names this repository.
3. Looks for the stored phrase of each claim source that has one (see below).
4. Saves claim sources (not Lab links) to the Internet Archive when no archive copy is stored and no snapshot newer than 180 days exists. Saves are 25 seconds apart, at most 10 a run. A failed save is listed, never counted as broken.
5. Opens, updates or closes one issue titled **Source links: weekly check**, labelled `links`.

## What the results mean

Only **Broken** opens, or keeps open, the issue. The other sections are informational: they appear in the issue body while it is open, and always in the run's job summary.

| Result               | When                                                                                                             | What to do                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Broken               | 404 or 410, or a DNS failure or 5xx (500 to 599) on every attempt                                                | Find another public source or the new location. Wording changes need the owner's approval; it ships as a content migration.    |
| Could not verify     | 401, 403, 429, other 4xx, unusual codes such as 999, errors that persist, or mixed attempts (429, 429, then 503) | Informational. Open the link by hand. Many publishers block automated requests; this is not a failure of the source.           |
| Phrase missing       | The page answered, is HTML or plain text, and no longer contains the stored phrase                               | Informational. Open the page and check the claim still stands. If the wording changed, a content migration updates the phrase. |
| Phrase not checkable | The stored phrase could not be looked for: not HTML or plain text, an error status, or the request failed        | Informational.                                                                                                                 |
| Archive save failed  | The Internet Archive refused, or returned no snapshot address                                                    | Informational. Usually transient. Retried next week.                                                                           |
| Moved                | The final host differs                                                                                           | Informational. Update the stored link when convenient.                                                                         |
| Archived this run    | A new snapshot was saved                                                                                         | Informational.                                                                                                                 |

After the first run, review the Could not verify list by hand. The HBK release notes answer 403 to bots, so expect it there.

A HEAD request is tried first. Any HEAD answer of 400 or above (or 405, 501) is repeated as a GET and the verdict comes from the GET.

## Phrases and archive copies

Three optional values per claim source (migration `20261029140000_source_checks.sql`, decision 0005):

| Where                          | Columns or keys                                           | Meaning                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `outcomes` (link sources only) | `source_phrase`, `source_archive_url`, `source_broken_on` | A short verbatim phrase from the public page that supports the claim, the Internet Archive copy, and the day the live page was found broken |
| `stops.detail_sources` items   | `phrase`, `archive_url`, `broken_on`                      | The same three, as optional keys of each item                                                                                               |

Rules the database enforces: a phrase has at least one non space character; an archive address looks like `https://web.archive.org/web/<14 digits>/https://...`; a broken day needs an archive address; an own measurement (`source_kind = 'own'`) carries none of the three. The owner's own repositories and Lab links never get a phrase or an archive copy, but that is the checker's rule (it ignores them) and not something the database enforces.

When a content migration deletes and re-inserts a stop's outcomes (as the 26 Oct Mukuru migration does), the new rows start with no phrase or archive copy. Set `source_phrase` and `source_archive_url` (and `source_broken_on` if it was set) again in the same migration, or change the rows with `update` instead.

What the checker does with them:

- A source whose status check passed and which has a phrase is requested once more with GET (read only, same politeness) and the phrase is searched in the text, ignoring tags, case, entities and spacing. Only `text/html` and `text/plain` are searched; other types are "Phrase not checkable". Pages that answer bots with 403 or draw their text with JavaScript cannot carry a phrase: leave it unset.
- A stored archive address means no save is attempted (the log shows `archive skipped <url> (archive copy stored)`).
- "Phrase missing" and "Phrase not checkable" are informational: they never open the issue and are not part of its digest, so they do not trigger a comment. They appear in the issue body while it is open and always in the job summary.
- The site types carry the archive address and broken day (`archiveUrl`, `brokenOn`) but nothing renders them yet. The phrase never reaches the site.
- The checker selects the new columns, so the migration must be applied before the checker runs on a commit that includes this change. Merging applies it first (decision 0019).

## The issue

| Situation                                                                                                                                            | Action                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A broken source and no open issue                                                                                                                    | Create it                                                 |
| Same entries as last week                                                                                                                            | Update the description only                               |
| Any entry changed (broken, could not verify, moved or archive failed, including its reason or new destination; a newly archived copy does not count) | Update the description and comment                        |
| No broken source and an open issue                                                                                                                   | Comment and close                                         |
| Database read failed, empty tables, or no sources found                                                                                              | Change nothing, and the run fails so the owner is emailed |

The `links` label is created up front so no run creates it. The workflow token has `contents: read` and `issues: write` only.

If the second call of an update with a comment, or of a comment and close, fails, a comment can be skipped or repeated on the next run. That is harmless.

## Running it locally

```
SUPABASE_URL=... SUPABASE_KEY=<publishable key> node scripts/check-source-links.mjs --dry-run
```

`--dry-run` prints the issue body and changes nothing on GitHub. It still contacts the sources and the Internet Archive, so use it sparingly.

## Limits to know

- The official SPN2 public API document (<https://docs.google.com/document/d/1Nsv52MvSjbLb2PCpHlat0gkzw0EvtSgpKHu4mk0MnrA>, updated 2026-07-22) allows anonymous use, with lower limits: 3 captures a minute, 200 a day, and 5 a day for one URL (its error table says 10). A capture may take up to 50 seconds of page time and 2 minutes in total. The checker saves 25 seconds apart (under 3 a minute), at most 10 a run.
- The checker uses the plain `GET /save/<url>` and reads the snapshot address from the `Content-Location` header (or a `rel="memento"` Link header, or the final URL). The document shows the GET form with cookies; reading the address that way is observed behaviour, used by palewire/savepagenow, and is not part of the published API. The first manual `workflow_dispatch` run is the evidence that it works anonymously. A refusal only lands under "Archive save failed" and breaks nothing else.
- Failure reasons include the underlying cause (for example `fetch failed (UND_ERR_SOCKET: other side closed)`), not just "fetch failed". The save request is made once with a 120 second timeout; the 120 second save timeout itself appears as "The operation was aborted due to timeout" with no cause; a retry will be added only if the logged causes show a dropped long connection.
- The run log has one outcome line per claim source. An `availability <url>: <timestamp and snapshot>` line appears only when the Availability API answered (`no usable snapshot` when it found none), followed by one outcome line: `archive saved <url> -> <web.archive.org address>`, `archive failed <url>: <reason> after <ms> ms`, or `archive skipped <url> (recent snapshot)`. Own sources, broken sources and sources past the cap of 10 get only `archive skipped <url> (own source)`, `(broken)` or `(cap reached)`, with no availability line. If the availability request itself throws, only `archive failed` is logged.
- The issue digest uses stable codes (`ETIMEDOUT`, `UND_ERR_SOCKET`, `HTTP 403`), not the full error text, so changing addresses and ports do not trigger a new comment. The full text stays in the issue body, the log and the job summary.
- The owner's own properties (github.com/olaheavy-dev, olaheavy.dev hosts, every Lab project link, and any outcome on a Lab project) are checked but never archived.
- The Internet Archive terms of use page (<https://archive.org/about/terms.php>) could not be read when this was built, so the terms were not checked.
- A run can take about 40 minutes when everything is slow (the archive phase about 27 minutes plus up to about 11 minutes of link checks), inside the 60 minute limit of the job.
- GitHub disables scheduled workflows on a public repository after 60 days without activity. Re-enable it from the Actions tab.

## Pausing and removing it

Pause: disable the workflow in the Actions tab. Remove: delete `.github/workflows/source-links.yml` and `scripts/source-links-workflow.test.ts` (and the script and its tests if the checker is dropped altogether), then close the open issue by hand.

## Tests

`scripts/check-source-links.test.ts` (classification, retries, throttle, phrases, archive rules, issue body and actions), `scripts/source-links-static.test.ts` (hard-coded URLs), `scripts/source-links-workflow.test.ts` (permissions, pins, no `${{` in `run`). No test calls the Internet Archive or GitHub.
