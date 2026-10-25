begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 7: the seed follows the claims policy (decision 0005).

select results_eq(
  $$select key from public.feature_flags where state = 'on' order by key$$,
  $$values ('page.home')$$,
  'only page.home is on'
);

select results_eq(
  $$select number::int, slug from public.stops order by number$$,
  $$values (1,'galooli'),(2,'access-bank'),(3,'stanbic-ibtc'),(4,'optty'),(5,'ulesson'),(6,'mukuru'),(7,'hbk')$$,
  'seven stops numbered 01 to 07'
);

select results_eq(
  $$select slug, filters::text from public.stops where slug in ('hbk','galooli','ulesson') order by slug$$,
  $$values ('galooli','{data_iot}'),('hbk','{ai,data_iot}'),('ulesson','{edtech}')$$,
  'filters follow the owner decision'
);

select is(
  (select count(*) from public.stops where status <> 'published'), 0::bigint, 'all seeded stops are published');

select results_eq(
  $$select s.slug, o.figure from public.outcomes o join public.stops s on s.id = o.stop_id order by s.slug$$,
  $$values ('access-bank','1M+'),('galooli','~11%'),('hbk','2025 R4'),('optty','90+')$$,
  'outcomes exist only for Access Bank, Galooli, HBK and Optty'
);

select is(
  (select count(*) from public.outcomes o join public.stops s on s.id = o.stop_id
   where s.slug in ('stanbic-ibtc', 'mukuru', 'ulesson')),
  0::bigint,
  'no outcomes for Stanbic IBTC, Mukuru or uLesson'
);

select results_eq(
  $$select l.slug, o.figure from public.outcomes o join public.lab_projects l on l.id = o.lab_project_id order by l.slug, o.position$$,
  $$values ('fastpilot','0.992'),('fastpilot','~210'),('fastpilot','90%'),('foresight','17')$$,
  'lab outcomes are the repository figures'
);

select is(
  (select count(*) from public.outcomes where source_kind = 'link' and (checked_on is null or checked_on < date '2026-10-25')),
  0::bigint,
  'every link was re-opened on or after the seed day'
);

select results_eq(
  $$select s.slug, o.claim_scope::text, o.attribution, o.as_of_year::int from public.outcomes o
    join public.stops s on s.id = o.stop_id where s.slug in ('optty','galooli','hbk') order by s.slug$$,
  $$values ('galooli','company','Galooli',2021),('hbk','company','HBK',2025),('optty','company','Optty',2023)$$,
  'company figures are attributed and dated'
);

select is((select count(*) from public.case_studies where status = 'draft'), 4::bigint, 'four draft case studies');
select is((select count(*) from public.case_studies where status <> 'draft'), 0::bigint, 'no published case study');
select is((select count(*) from public.case_study_sections), 28::bigint, 'seven section titles per case study');
select is((select count(*) from public.case_study_sections where body is not null), 0::bigint, 'section titles only');

select results_eq(
  $$select slug, in_progress from public.lab_projects order by position$$,
  $$values ('foresight', false),('fastpilot', false),('homescout', true),('sabitutor', true)$$,
  'lab projects and their in progress tag'
);
select is((select live_url from public.lab_projects where slug = 'foresight'), 'https://foresight.olaheavy.dev', 'Foresight has its live URL');
select is((select count(*) from public.lab_projects where slug = 'fastpilot' and live_url is null and demo_url is null), 1::bigint, 'FastPilot has no demo link');
select is(
  (select count(*) from public.lab_projects where slug = 'sabitutor'
   and repo_url is null and live_url is null and demo_url is null and video_url is null and writeup_url is null),
  1::bigint, 'SabiTutor has no links');
select is((select count(*) from public.lab_projects where lower(slug) = 'raglab' or lower(name) like '%raglab%'), 0::bigint, 'RagLab is not a lab project');

select results_eq(
  $$select slug, is_home from public.countries order by slug$$,
  $$values ('albania', false),('nigeria', true),('united-kingdom', false)$$,
  'three countries, one home'
);
select is((select count(*) from public.trips), 0::bigint, 'no trips yet');

select is(
  (select count(*) from public.settings where key like 'profile.%' and value->'url' <> 'null'::jsonb),
  0::bigint,
  'social links are seeded empty'
);
select is(
  (select count(*) from public.settings where value::text ~ '@[a-z0-9-]+\.[a-z]|\+?[0-9][0-9 ()]{8,}'),
  0::bigint,
  'no email address or phone number in settings'
);

select is(
  (select value #>> '{}' from public.settings where key = 'site.availability'),
  E'Open to senior & staff AI roles\u00a0\u00b7 consulting',
  'availability matches src/lib/site.ts, including the non-breaking space'
);

select results_eq(
  $$select o.claim_scope::text, o.attribution, o.as_of_year::int from public.outcomes o
    join public.stops s on s.id = o.stop_id where s.slug = 'access-bank'$$,
  $$values ('company', 'Google Play', 2026)$$,
  'the QuickBucks figure is attributed to Google Play, the publisher of the number'
);

select * from finish();
rollback;
