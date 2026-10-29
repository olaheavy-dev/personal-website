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
  $$select slug, filters::text from public.stops order by slug$$,
  $$values ('access-bank','{payments}'),('galooli','{data_iot}'),('hbk','{ai,data_iot}'),('mukuru','{payments}'),('optty','{payments}'),('stanbic-ibtc','{payments}'),('ulesson','{edtech}')$$,
  'every stop has the area labels the owner decided'
);

select is(
  (select count(*) from public.stops where status <> 'published'), 0::bigint, 'all seeded stops are published');

select results_eq(
  $$select s.slug, o.figure from public.outcomes o join public.stops s on s.id = o.stop_id order by s.slug$$,
  $$values ('access-bank','1M+'),('galooli','~11%'),('hbk','2025 R4'),('mukuru','17M+'),('optty','90+')$$,
  'outcomes exist only for Access Bank, Galooli, HBK, Mukuru and Optty'
);

select is(
  (select count(*) from public.outcomes o join public.stops s on s.id = o.stop_id
   where s.slug in ('stanbic-ibtc', 'ulesson')),
  0::bigint,
  'no outcomes for Stanbic IBTC or uLesson'
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
    join public.stops s on s.id = o.stop_id where s.slug in ('optty','galooli','hbk','mukuru') order by s.slug$$,
  $$values ('galooli','company','Galooli',2021),('hbk','company','HBK',2025),('mukuru','company','Mukuru',2025),('optty','company','Optty',2023)$$,
  'company figures are attributed and dated'
);

-- The approved home copy (issue #9, 25 Oct 2026) is in the seed, word for word.
select results_eq(
  $$select slug, summary from public.stops where summary is not null order by slug$$,
  $$values
    ('access-bank', 'Built and shipped QuickBucks and Instant Account, Access Bank''s mobile banking products, in a regulated, high-stakes production environment.'),
    ('galooli', 'Field deployment and support of Galooli''s IoT energy management for telecom tower sites across Nigeria.'),
    ('hbk', 'Designing and building HBK''s sensor-data analytics platform for test, durability and fatigue engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like Python code suggestions and file data analysis.'),
    ('mukuru', 'Integrations that land Mukuru''s cross-border transfers in Malawian mobile money wallets, with USSD payment flows built to handle errors and retries.'),
    ('optty', 'Design and delivery of the integrations behind Optty''s payments orchestration platform, connecting merchants to buy now, pay later and local payment methods.'),
    ('stanbic-ibtc', 'Digital banking products in Stanbic IBTC''s Innovation Lab, built on open banking APIs with fintech partners.'),
    ('ulesson', 'Web platform work for uLesson''s learning app: a redesign, faster pages and better observability.')$$,
  'the stops with approved summaries (Home and Work) have them word for word and no other stop has one'
);

-- The approved Work details (issue #10, 27 Oct 2026): four stops, in order, none for the others.
select results_eq(
  $$select slug, cardinality(details) from public.stops order by number$$,
  $$values ('galooli', 2), ('access-bank', 4), ('stanbic-ibtc', 4), ('optty', 3), ('ulesson', 3), ('mukuru', 2), ('hbk', 1)$$,
  'the approved Work details are seeded: Galooli 2, Access Bank 4, Stanbic IBTC 4, Optty 3, uLesson 3, Mukuru 2, HBK 1'
);
select is(
  (select details[1] from public.stops where slug = 'mukuru'),
  'Integrated mobile wallet providers and Malawi''s national payment switch so remittances reach wallets.',
  'Mukuru''s first detail line is the approved wording'
);

select results_eq(
  $$select slug, jsonb_array_length(detail_sources) from public.stops order by number$$,
  $$values ('galooli', 0), ('access-bank', 2), ('stanbic-ibtc', 0), ('optty', 0), ('ulesson', 0), ('mukuru', 0), ('hbk', 0)$$,
  'only Access Bank has detail sources: the Device Finance launch (BusinessPost) and the Konga partnership'
);
select is(
  (select jsonb_agg(item - 'phrase' - 'archive_url' order by ord) from public.stops s, jsonb_array_elements(s.detail_sources) with ordinality as t(item, ord) where s.slug = 'access-bank'),
  '[{"label": "Device Finance launch (BusinessPost)", "url": "https://businesspost.ng/2019/08/14/access-bank-boosts-lending-with-smartphone-device-financing-scheme/"}, {"label": "Konga partnership", "url": "https://brandcom.ng/2023/05/24/access-bank-konga-partner-to-provide-installment-payments-through-pay-with-quickbucks/"}]'::jsonb,
  'Access Bank''s sources are the approved labels and links'
);

select results_eq(
  $$select slug, summary from public.lab_projects where summary is not null order by slug$$,
  $$values
    ('fastpilot', 'A production RAG system for learning FastAPI: understand, watch, practise.'),
    ('foresight', 'A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.'),
    ('homescout', 'A home decision workspace for people buying or renting in England, at the research and concept stage.')$$,
  'the three Lab strip projects have their approved summaries and SabiTutor has none'
);

select results_eq(
  $$select s.slug, o.figure, o.description from public.outcomes o join public.stops s on s.id = o.stop_id
    where s.slug in ('mukuru','optty','access-bank','galooli') order by s.slug$$,
  $$values
    ('access-bank', '1M+', 'downloads of the QuickBucks app'),
    ('galooli', '~11%', 'fuel saving across several hundred sites in Nigeria'),
    ('mukuru', '17M+', 'customers served'),
    ('optty', '90+', 'BNPL and local payment methods across 120+ countries')$$,
  'the Selected stops chips and Galooli''s have the approved short descriptions, one outcome each'
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
