begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Source check data (issue #127): outcomes.source_phrase, source_archive_url, source_broken_on and
-- the optional phrase, archive_url and broken_on keys of stops.detail_sources.
-- 23514 is check_violation.

select col_is_null('public', 'outcomes', 'source_phrase', 'source_phrase is nullable');
select col_is_null('public', 'outcomes', 'source_archive_url', 'source_archive_url is nullable');
select col_is_null('public', 'outcomes', 'source_broken_on', 'source_broken_on is nullable');
select ok(
  has_column_privilege('anon', 'public.outcomes', 'source_archive_url', 'select'),
  'anon can read the archive address'
);

-- Outcomes: a link source takes the three values.
select lives_ok(
  $$update public.outcomes set source_phrase = 'a phrase', source_archive_url = 'https://web.archive.org/web/20261029213726/https://example.com/x', source_broken_on = '2026-11-02'
    where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  'a link source accepts a phrase, an archive copy and a broken day'
);
select throws_ok(
  $$update public.outcomes set source_phrase = '  ' where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  '23514', null, 'a blank phrase is rejected'
);
select throws_ok(
  $$update public.outcomes set source_archive_url = 'https://example.com/x' where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  '23514', null, 'an archive address outside the Internet Archive is rejected'
);
select throws_ok(
  $$update public.outcomes set source_archive_url = 'http://web.archive.org/web/20261029213726/https://example.com/x' where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  '23514', null, 'a plain http archive address is rejected'
);
select throws_ok(
  $$update public.outcomes set source_archive_url = 'https://web.archive.org/web/2026/https://example.com/x' where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  '23514', null, 'an archive address without a 14 digit snapshot time is rejected'
);
select throws_ok(
  $$update public.outcomes set source_archive_url = null, source_broken_on = '2026-11-02' where id = (select id from public.outcomes where source_kind = 'link' limit 1)$$,
  '23514', null, 'a broken day without an archive copy is rejected'
);
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note, source_phrase)
    values ((select id from public.stops where slug = 'hbk'), '1', 'own', 'own', 'n', 'x')$$,
  '23514', null, 'an own measurement cannot carry a phrase'
);
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note, source_archive_url)
    values ((select id from public.stops where slug = 'hbk'), '1', 'own', 'own', 'n', 'https://web.archive.org/web/20261029213726/https://example.com/x')$$,
  '23514', null, 'an own measurement cannot carry an archive copy'
);

-- Detail sources: the optional keys.
select lives_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "phrase": "some words", "archive_url": "https://web.archive.org/web/20261029213726/https://example.com/a", "broken_on": "2026-11-02"}]' where slug = 'hbk'$$,
  'a source with a phrase, an archive copy and a broken day is accepted'
);
select lives_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "phrase": "some words"}]' where slug = 'hbk'$$,
  'a source with only a phrase is accepted'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "phrase": "  "}]' where slug = 'hbk'$$,
  '23514', null, 'a blank phrase is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "phrase": 3}]' where slug = 'hbk'$$,
  '23514', null, 'a phrase that is not text is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "archive_url": "https://example.com/a"}]' where slug = 'hbk'$$,
  '23514', null, 'an archive address outside the Internet Archive is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "archive_url": "https://webxarchive.org/web/20261029213726/https://example.com/a"}]' where slug = 'hbk'$$,
  '23514', null, 'the dots in the archive host are literal'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "broken_on": "2026-11-02"}]' where slug = 'hbk'$$,
  '23514', null, 'a broken day without an archive copy is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a", "archive_url": "https://web.archive.org/web/20261029213726/https://example.com/a", "broken_on": "yesterday"}]' where slug = 'hbk'$$,
  '23514', null, 'a broken day that is not YYYY-MM-DD is rejected'
);

select * from finish();
rollback;
