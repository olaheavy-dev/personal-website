begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 3: anon and authenticated cannot write any table (42501);
-- the secret key role (service_role) can.

create temp table t_tables (name text);
insert into t_tables
  select tablename from pg_tables where schemaname = 'public';
grant select on t_tables to anon, authenticated;

set local role anon;
select throws_ok(format('insert into public.%I default values', name), '42501', null, 'anon cannot insert into ' || name)
  from t_tables order by name;
select throws_ok('update public.stops set name = name', '42501', null, 'anon cannot update stops');
select throws_ok('delete from public.stops', '42501', null, 'anon cannot delete stops');
select throws_ok('delete from public.feature_flags', '42501', null, 'anon cannot delete flags');
select throws_ok('update public.settings set value = value', '42501', null, 'anon cannot update settings');

set local role authenticated;
select throws_ok(format('insert into public.%I default values', name), '42501', null, 'authenticated cannot insert into ' || name)
  from t_tables order by name;
select throws_ok('update public.stops set name = name', '42501', null, 'authenticated cannot update stops');
select throws_ok('delete from public.stops', '42501', null, 'authenticated cannot delete stops');
select throws_ok('delete from public.feature_flags', '42501', null, 'authenticated cannot delete flags');
select throws_ok('update public.settings set value = value', '42501', null, 'authenticated cannot update settings');

set local role service_role;
select lives_ok(
  $$insert into public.settings (key, value) values ('test.key', '"v"')$$,
  'the secret key role can write settings'
);
select lives_ok(
  $$update public.stops set summary = 'x' where slug = 'hbk'$$,
  'the secret key role can update stops'
);
select lives_ok(
  $$insert into public.assistant_evals (question) values ('Who is Sunkanmi?')$$,
  'the secret key role can write assistant_evals'
);
select is((select count(*) from public.stops), 7::bigint, 'the secret key role reads all stops');
select is(
  (select count(*) from public.feature_flags),
  14::bigint,
  'the secret key role reads flags in every state'
);

reset role;
select * from finish();
rollback;
