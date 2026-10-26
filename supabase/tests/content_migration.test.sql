begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Decision 0019: a content migration can run again on seeded data and change nothing.
-- The CLI records each applied migration's statements, so the test replays those.
-- Timestamps are left out: a re-run touches updated_at and recreates the outcome row.

create temporary table before_content as
  select
    (select coalesce(jsonb_agg(to_jsonb(s) - 'created_at' - 'updated_at' order by s.slug), '[]') from public.stops s) as stops,
    (select coalesce(jsonb_agg(to_jsonb(o) - 'id' - 'created_at' - 'updated_at' order by o.figure, o.stop_id), '[]') from public.outcomes o) as outcomes;

select is(
  (select count(*) from supabase_migrations.schema_migrations where name = 'selected_stops_content'),
  1::bigint,
  'the content migration was applied and recorded'
);

do $$
declare
  stmt text;
begin
  for stmt in
    select unnest(statements) from supabase_migrations.schema_migrations where name = 'selected_stops_content'
  loop
    execute stmt;
  end loop;
end
$$;

select is(
  (select stops from before_content),
  (select coalesce(jsonb_agg(to_jsonb(s) - 'created_at' - 'updated_at' order by s.slug), '[]') from public.stops s),
  'running the content migration again leaves the stops unchanged'
);

select is(
  (select outcomes from before_content),
  (select coalesce(jsonb_agg(to_jsonb(o) - 'id' - 'created_at' - 'updated_at' order by o.figure, o.stop_id), '[]') from public.outcomes o),
  'running the content migration again leaves the outcomes unchanged'
);

select is(
  (select count(*) from public.outcomes o join public.stops s on s.id = o.stop_id where s.slug = 'mukuru'),
  1::bigint,
  'Mukuru still has exactly one outcome'
);

select * from finish();
rollback;
