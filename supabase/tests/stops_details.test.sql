begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- stops.details: a list of at most four lines, empty by default (issue #10).
-- 23514 is check_violation.

select col_not_null('public', 'stops', 'details', 'details is never null');
select col_default_is('public', 'stops', 'details', '{}', 'details defaults to an empty list');

select lives_ok(
  $$update public.stops set details = array['a', 'b', 'c', 'd'] where slug = 'hbk'$$,
  'four detail lines are accepted'
);
select throws_ok(
  $$update public.stops set details = array['a', 'b', 'c', 'd', 'e'] where slug = 'hbk'$$,
  '23514', null, 'a fifth detail line is rejected'
);
select throws_ok(
  $$update public.stops set details = null where slug = 'hbk'$$,
  '23502', null, 'details cannot be set to null'
);

-- stops.detail_sources: a list of {label, url} objects with a label and an https link.
select col_not_null('public', 'stops', 'detail_sources', 'detail_sources is never null');
select lives_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "https://example.com/a"}]' where slug = 'hbk'$$,
  'a source with a label and an https link is accepted'
);
select lives_ok(
  $$update public.stops set detail_sources = '[]' where slug = 'hbk'$$,
  'an empty list is accepted'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A", "url": "http://example.com"}]' where slug = 'hbk'$$,
  '23514', null, 'a plain http link is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "", "url": "https://example.com"}]' where slug = 'hbk'$$,
  '23514', null, 'an empty label is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"url": "https://example.com"}]' where slug = 'hbk'$$,
  '23514', null, 'a missing label is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '[{"label": "A"}]' where slug = 'hbk'$$,
  '23514', null, 'a missing link is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '["https://example.com"]' where slug = 'hbk'$$,
  '23514', null, 'an item that is not an object is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = '{"label": "A", "url": "https://example.com"}' where slug = 'hbk'$$,
  '23514', null, 'a value that is not a list is rejected'
);
select throws_ok(
  $$update public.stops set detail_sources = null where slug = 'hbk'$$,
  '23502', null, 'detail_sources cannot be set to null'
);

select * from finish();
rollback;
