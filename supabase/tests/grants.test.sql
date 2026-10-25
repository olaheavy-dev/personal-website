begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Closed by default, and every function pins its search_path.

select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'),
  0::bigint,
  'anon and authenticated hold only SELECT grants'
);

select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated')
     and table_name in ('kb_chunks', 'assistant_evals')),
  0::bigint,
  'no grants on the server only tables'
);

-- A table created later starts closed.
create table public.zz_new_table (id int);
select ok(not has_table_privilege('anon', 'public.zz_new_table', 'select'), 'a new table is closed to anon');
select ok(not has_table_privilege('authenticated', 'public.zz_new_table', 'select'), 'a new table is closed to authenticated');
select ok(not has_table_privilege('anon', 'public.zz_new_table', 'insert'), 'a new table cannot be written by anon');

select is(
  (select count(*) from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and not coalesce('search_path=""' = any (p.proconfig), false)),
  0::bigint,
  'every public function sets search_path to empty'
);

select is(
  (select count(*) from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  0::bigint,
  'anon and authenticated cannot execute public functions'
);

select hasnt_column('public', 'photos', 'latitude', 'photos carry no latitude');
select is(
  (select count(*) from information_schema.columns
   where table_schema = 'public' and column_name ~* '(^|_)(lat|lng|lon|latitude|longitude|geo|gps)'),
  0::bigint,
  'no table stores coordinates'
);

select * from finish();
rollback;
