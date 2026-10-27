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
  (select count(*) from supabase_migrations.schema_migrations where name = 'ticket_details_content'),
  1::bigint,
  'the content migration was applied and recorded'
);

select is(
  (select cardinality(statements) from supabase_migrations.schema_migrations where name = 'ticket_details_content'),
  4,
  'four statements were recorded, so the replay below runs something'
);

do $$
declare
  stmt text;
begin
  for stmt in
    select unnest(statements) from supabase_migrations.schema_migrations where name = 'ticket_details_content'
  loop
    execute stmt;
  end loop;
end
$$;

select is(
  (select stops from before_content),
  (select coalesce(jsonb_agg(to_jsonb(s) - 'created_at' - 'updated_at' order by s.slug), '[]') from public.stops s),
  'running the ticket details migration again leaves the stops unchanged'
);

select is(
  (select outcomes from before_content),
  (select coalesce(jsonb_agg(to_jsonb(o) - 'id' - 'created_at' - 'updated_at' order by o.figure, o.stop_id), '[]') from public.outcomes o),
  'running the ticket details migration again leaves the outcomes unchanged'
);

select is(
  (select count(*) from public.stops where cardinality(details) > 0),
  7::bigint,
  'all seven stops have details'
);

select is(
  (select jsonb_array_length(detail_sources) from public.stops where slug = 'access-bank'),
  2,
  'Access Bank keeps its two sources after the replay'
);

select * from finish();
rollback;
