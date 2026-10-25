begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 1: every table has row level security enabled.
select is(
  (select count(*) from pg_tables where schemaname = 'public'),
  14::bigint,
  'public has the 14 expected tables'
);

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'every public table has RLS enabled'
);

select * from finish();
rollback;
