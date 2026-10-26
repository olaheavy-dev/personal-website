begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 2: anon and authenticated read published rows only,
-- including the parent rules and flags that are "on".

-- Extra rows, created as the owner role: drafts, and children of drafts.
insert into public.stops (slug, number, name, kind, start_year, status)
  values ('t-draft', 90, 'Draft stop', 'compact', 2020, 'draft');
insert into public.outcomes (stop_id, figure, description, source_kind, source_note)
  values ((select id from public.stops where slug = 't-draft'), '1', 'of a draft stop', 'own', 'test');

insert into public.lab_projects (slug, name, status) values ('t-draft-lab', 'Draft lab', 'draft');
insert into public.outcomes (lab_project_id, figure, description, source_kind, source_note)
  values ((select id from public.lab_projects where slug = 't-draft-lab'), '1', 'of a draft project', 'own', 'test');

insert into public.feature_flags (key, state) values ('page.t-preview', 'preview'), ('page.t-on', 'on');

-- A published case study with its sections (passes the publish gate).
insert into public.case_studies (slug, title) values ('t-published', 'Published test');
insert into public.outcomes (case_study_id, figure, description, source_kind, source_note)
  select id, g::text, 'sourced', 'own', 'test' from public.case_studies, generate_series(1, 3) g where slug = 't-published';
insert into public.case_study_sections (case_study_id, anchor, position, title)
  select id, 'context', 1, 'Context' from public.case_studies where slug = 't-published';
update public.case_studies set status = 'published', tldr = array['One bullet'] where slug = 't-published';

-- Travel parent rules.
insert into public.countries (slug, name, iso2, status) values ('t-draft-country', 'Draftland', 'ZZ', 'draft'), ('t-pub-country', 'Publand', 'ZY', 'published');
insert into public.trips (country_id, slug, title, year, status)
  select id, 't-trip', 'Trip', 2025, 'published' from public.countries where slug in ('t-draft-country', 't-pub-country');
insert into public.media (kind, storage_path, alt, status) values ('image', 't/a.jpg', 'alt', 'draft'), ('image', 't/b.jpg', 'alt', 'published');
insert into public.photos (trip_id, media_id, status)
  select (select t.id from public.trips t join public.countries c on c.id = t.country_id where c.slug = 't-pub-country'),
         m.id, 'published' from public.media m where m.storage_path in ('t/a.jpg', 't/b.jpg');

-- kb_chunks and posts: a draft post is hidden.
insert into public.posts_cache (hashnode_id, slug, title, published_at, status)
  values ('h1', 't-post-pub', 'Pub', now(), 'published'), ('h2', 't-post-draft', 'Draft', now(), 'draft');

set local role anon;
select is((select count(*) from public.stops), 7::bigint, 'anon: only the 7 published stops');
select is((select count(*) from public.stops where slug = 't-draft'), 0::bigint, 'anon: draft stop hidden');
select is((select count(*) from public.outcomes), 12::bigint, 'anon: 9 seeded + 3 of the published case study; drafts hide their outcomes');
select is((select count(*) from public.lab_projects), 4::bigint, 'anon: only published lab projects');
select is((select count(*) from public.feature_flags), 2::bigint, 'anon: flags that are on (home and the test flag), not preview or off');
select is((select count(*) from public.feature_flags where state <> 'on'), 0::bigint, 'anon: no flag in another state');
select is((select count(*) from public.case_studies), 1::bigint, 'anon: only the published case study');
select is((select count(*) from public.case_study_sections), 1::bigint, 'anon: sections of draft case studies hidden');
select is((select count(*) from public.countries where slug like 't-%'), 1::bigint, 'anon: draft country hidden');
select is((select count(*) from public.trips), 1::bigint, 'anon: trip of a draft country hidden');
select is((select count(*) from public.photos), 1::bigint, 'anon: photo with draft media hidden');
select is((select count(*) from public.media), 1::bigint, 'anon: draft media hidden');
select is((select count(*) from public.posts_cache), 1::bigint, 'anon: draft post hidden');
select is((select count(*) from public.settings), 14::bigint, 'anon: settings are public');

set local role authenticated;
select is((select count(*) from public.stops), 7::bigint, 'authenticated: only the 7 published stops');
select is((select count(*) from public.outcomes), 12::bigint, 'authenticated: outcomes of published parents only');
select is((select count(*) from public.lab_projects), 4::bigint, 'authenticated: only published lab projects');
select is((select count(*) from public.feature_flags where state <> 'on'), 0::bigint, 'authenticated: only flags that are on');
select is((select count(*) from public.case_studies), 1::bigint, 'authenticated: only the published case study');
select is((select count(*) from public.case_study_sections), 1::bigint, 'authenticated: sections follow their case study');
select is((select count(*) from public.trips), 1::bigint, 'authenticated: trip of a draft country hidden');
select is((select count(*) from public.photos), 1::bigint, 'authenticated: photo with draft media hidden');
select is((select count(*) from public.posts_cache), 1::bigint, 'authenticated: draft post hidden');

reset role;
select * from finish();
rollback;
