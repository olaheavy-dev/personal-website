begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Decision 0019 and issue #127: the source phrases content migration can run again and change
-- nothing, and the seed holds the same values. The CLI records each applied migration's
-- statements, so the test replays those.

create temporary table before_content as
  select
    (select coalesce(jsonb_agg(to_jsonb(s) - 'created_at' - 'updated_at' order by s.slug), '[]') from public.stops s) as stops,
    (select coalesce(jsonb_agg(to_jsonb(o) - 'created_at' - 'updated_at' order by o.id), '[]') from public.outcomes o) as outcomes;

select is(
  (select count(*) from supabase_migrations.schema_migrations where name = 'source_phrases_content'),
  1::bigint,
  'the content migration was applied and recorded'
);
select is(
  (select cardinality(statements) from supabase_migrations.schema_migrations where name = 'source_phrases_content'),
  7,
  'seven statements were recorded, so the replay below runs something'
);

do $$
declare
  stmt text;
begin
  for stmt in
    select unnest(statements) from supabase_migrations.schema_migrations where name = 'source_phrases_content'
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
  (select coalesce(jsonb_agg(to_jsonb(o) - 'created_at' - 'updated_at' order by o.id), '[]') from public.outcomes o),
  'running the content migration again leaves the outcomes unchanged'
);

-- The seeded values.
select is(
  (select count(*) from public.outcomes where source_archive_url like 'https://web.archive.org/web/%'),
  5::bigint,
  'five outcomes have an archive copy'
);
select is(
  (select count(*) from public.outcomes where source_phrase is not null),
  4::bigint,
  'four outcomes have a phrase'
);
select is(
  (select o.source_phrase from public.outcomes o join public.stops s on s.id = o.stop_id where s.slug = 'hbk'),
  null,
  'the HBK outcome has no phrase'
);
select is(
  (select count(*) from public.outcomes where source_broken_on is not null),
  0::bigint,
  'no broken day is set'
);
select results_eq(
  $$select item->>'url', item ? 'phrase', item ? 'archive_url', item ? 'broken_on'
    from public.stops s, jsonb_array_elements(s.detail_sources) item where s.slug = 'access-bank' order by item->>'url'$$,
  $$values
    ('https://brandcom.ng/2023/05/24/access-bank-konga-partner-to-provide-installment-payments-through-pay-with-quickbucks/', true, true, false),
    ('https://businesspost.ng/2019/08/14/access-bank-boosts-lending-with-smartphone-device-financing-scheme/', true, true, false)$$,
  'both Access Bank detail sources have a phrase and an archive copy and no broken day'
);
select is(
  (select jsonb_array_length(detail_sources) from public.stops where slug = 'access-bank'),
  2,
  'the detail sources keep their order and count'
);

select * from finish();
rollback;
