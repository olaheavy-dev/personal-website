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

select * from finish();
rollback;
