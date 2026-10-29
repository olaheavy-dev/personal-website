-- Data for the weekly source link checker (issue #127, decision 0005). Every column is nullable
-- and nothing reads them yet, so the image that is still serving keeps working (decision 0019).
--   source_phrase      a short verbatim phrase from the public page that supports the claim; the
--                      checker looks for it in the page and reports when it is missing
--   source_archive_url the Internet Archive copy of the page, https://web.archive.org/web/<14 digits>/https://...
--   source_broken_on   the day the live page was found broken; only meaningful with an archive copy
-- The owner's own measurements have no page, so they carry none of the three.
alter table public.outcomes
  add column if not exists source_phrase text,
  add column if not exists source_archive_url text,
  add column if not exists source_broken_on date;

alter table public.outcomes
  drop constraint if exists outcomes_source_phrase_not_blank,
  drop constraint if exists outcomes_source_archive_url_shape,
  drop constraint if exists outcomes_source_broken_needs_archive,
  drop constraint if exists outcomes_own_source_has_no_page_data;

alter table public.outcomes
  add constraint outcomes_source_phrase_not_blank check (
    source_phrase is null or btrim(source_phrase) <> ''
  ),
  add constraint outcomes_source_archive_url_shape check (
    source_archive_url is null
    or source_archive_url ~ '^https://web\.archive\.org/web/[0-9]{14}/https://'
  ),
  add constraint outcomes_source_broken_needs_archive check (
    source_broken_on is null or source_archive_url is not null
  ),
  add constraint outcomes_own_source_has_no_page_data check (
    source_kind = 'link'
    or (source_phrase is null and source_archive_url is null and source_broken_on is null)
  );

-- A stop's detail sources may also carry phrase, archive_url and broken_on (all optional). A
-- phrase is a non empty string; archive_url has the Internet Archive shape; broken_on is a
-- YYYY-MM-DD day and needs an archive_url. The Posix class [.] stands for a literal dot because a
-- backslash inside a jsonpath string is an escape. Every item must pass the filter.
alter table public.stops
  drop constraint if exists stops_detail_sources_shape;
alter table public.stops
  add constraint stops_detail_sources_shape check (
    case
      when jsonb_typeof(detail_sources) = 'array' then
        jsonb_array_length(detail_sources) = jsonb_array_length(
          jsonb_path_query_array(
            detail_sources,
            '$[*] ? (@.type() == "object" && @.label.type() == "string" && @.label != "" && @.url.type() == "string" && @.url like_regex "^https://.+" && (!exists(@.phrase) || (@.phrase.type() == "string" && @.phrase like_regex "[^ \t\r\n]")) && (!exists(@.archive_url) || (@.archive_url.type() == "string" && @.archive_url like_regex "^https://web[.]archive[.]org/web/[0-9]{14}/https://")) && (!exists(@.broken_on) || (@.broken_on.type() == "string" && @.broken_on like_regex "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" && exists(@.archive_url))))'
          )
        )
      else false
    end
  );
