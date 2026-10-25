begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 5: the claims policy and data rules are enforced by constraints.
-- 23514 is check_violation, 23505 is unique_violation.

-- Outcomes: exactly one parent.
select throws_ok(
  $$insert into public.outcomes (figure, description, source_kind, source_note) values ('1', 'no parent', 'own', 'n')$$,
  '23514', null, 'an outcome with no parent is rejected');
select throws_ok(
  $$insert into public.outcomes (stop_id, lab_project_id, figure, description, source_kind, source_note)
    values ((select id from public.stops where slug = 'hbk'), (select id from public.lab_projects where slug = 'foresight'), '1', 'two parents', 'own', 'n')$$,
  '23514', null, 'an outcome with two parents is rejected');

-- Outcomes: the source rules.
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_label, source_url, checked_on)
    values ((select id from public.stops where slug = 'hbk'), '1', 'http link', 'link', 'Label', 'http://example.com', current_date)$$,
  '23514', null, 'a link needs an https URL');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_label, checked_on)
    values ((select id from public.stops where slug = 'hbk'), '1', 'no url', 'link', 'Label', current_date)$$,
  '23514', null, 'a link needs a URL');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_url, checked_on)
    values ((select id from public.stops where slug = 'hbk'), '1', 'no label', 'link', 'https://example.com', current_date)$$,
  '23514', null, 'a link needs a label');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_label, source_url, source_note, checked_on)
    values ((select id from public.stops where slug = 'hbk'), '1', 'link with note', 'link', 'Label', 'https://example.com', 'note', current_date)$$,
  '23514', null, 'a link must not carry a note');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_label, source_url)
    values ((select id from public.stops where slug = 'hbk'), '1', 'never re-opened', 'link', 'Label', 'https://example.com')$$,
  '23514', null, 'a link needs the date it was last checked');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind)
    values ((select id from public.stops where slug = 'hbk'), '1', 'own without note', 'own')$$,
  '23514', null, 'an own measurement needs a note');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note, source_url)
    values ((select id from public.stops where slug = 'hbk'), '1', 'own with url', 'own', 'note', 'https://example.com')$$,
  '23514', null, 'an own measurement must not carry a URL');
select lives_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note)
    values ((select id from public.stops where slug = 'hbk'), '1', 'valid own', 'own', 'Lighthouse, mobile')$$,
  'a valid own measurement is accepted');

-- Outcomes: company claims.
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note, claim_scope, as_of_year)
    values ((select id from public.stops where slug = 'hbk'), '1', 'no attribution', 'own', 'n', 'company', 2024)$$,
  '23514', null, 'a company claim needs an attribution');
select throws_ok(
  $$insert into public.outcomes (stop_id, figure, description, source_kind, source_note, claim_scope, attribution)
    values ((select id from public.stops where slug = 'hbk'), '1', 'no year', 'own', 'n', 'company', 'HBK')$$,
  '23514', null, 'a company claim needs an as of year');

-- Lab projects.
select throws_ok(
  $$insert into public.lab_projects (slug, name) values ('raglab', 'Something')$$,
  '23514', null, 'the raglab slug is refused');
select throws_ok(
  $$insert into public.lab_projects (slug, name) values ('other', 'RagLab')$$,
  '23514', null, 'the RagLab name is refused');
select throws_ok(
  $$insert into public.lab_projects (slug, name, repo_url) values ('t1', 'T', 'http://example.com')$$,
  '23514', null, 'repo_url must be https');
select throws_ok(
  $$insert into public.lab_projects (slug, name, live_url) values ('t2', 'T', 'ftp://example.com')$$,
  '23514', null, 'live_url must be https');
select throws_ok(
  $$insert into public.lab_projects (slug, name, demo_url) values ('t3', 'T', 'example.com')$$,
  '23514', null, 'demo_url must be https');
select throws_ok(
  $$insert into public.lab_projects (slug, name, video_url) values ('t4', 'T', 'http://example.com')$$,
  '23514', null, 'video_url must be https');
select is(
  (select in_progress from public.lab_projects where slug = 'homescout'), true, 'in_progress is a boolean flag');

-- Feature flags.
select throws_ok(
  $$insert into public.feature_flags (key) values ('work')$$, '23514', null, 'a flag key needs a prefix');
select throws_ok(
  $$insert into public.feature_flags (key) values ('page.Work')$$, '23514', null, 'a flag key is lower case');
select throws_ok(
  $$insert into public.feature_flags (key) values ('other.work')$$, '23514', null, 'a flag key uses page, case or feature');
select throws_ok(
  $$insert into public.feature_flags (key) values ('page.-work')$$, '23514', null, 'a flag key segment cannot start with a hyphen');
select lives_ok(
  $$insert into public.feature_flags (key) values ('case.new-study')$$, 'a valid flag key is accepted');
select throws_ok(
  $$update public.feature_flags set state = 'off' where key = 'page.home'$$, '23514', null, 'page.home cannot be turned off');
select throws_ok(
  $$update public.feature_flags set state = 'preview' where key = 'page.home'$$, '23514', null, 'page.home cannot be preview');
select throws_ok(
  $$delete from public.feature_flags where key = 'page.home'$$, '23514', null, 'page.home cannot be deleted');

-- Countries: one home.
select throws_ok(
  $$insert into public.countries (slug, name, iso2, is_home) values ('t-home', 'Second home', 'ZZ', true)$$,
  '23505', null, 'a second home country is rejected');

-- Media.
select throws_ok(
  $$insert into public.media (kind, storage_path, status) values ('image', 't/1.jpg', 'published')$$,
  '23514', null, 'publishing media needs alt text');
select throws_ok(
  $$insert into public.media (kind, storage_path, alt, status) values ('image', 't/2.jpg', '   ', 'published')$$,
  '23514', null, 'blank alt text does not count');
select lives_ok(
  $$insert into public.media (kind, storage_path) values ('image', 't/3.jpg')$$, 'draft media may lack alt text');
select throws_ok(
  $$insert into public.media (kind, storage_path, alt, is_ai_generated) values ('image', 't/4.jpg', 'alt', true)$$,
  '23514', null, 'an AI generated image needs a caption');
select lives_ok(
  $$insert into public.media (kind, storage_path, alt, caption, is_ai_generated) values ('image', 't/5.jpg', 'alt', 'AI generated concept image', true)$$,
  'a captioned AI image is accepted');

-- Stops.
select throws_ok(
  $$insert into public.stops (slug, number, name, kind, start_year, end_year) values ('t-years', 91, 'T', 'compact', 2020, 2019)$$,
  '23514', null, 'a stop cannot end before it starts');
select throws_ok(
  $$insert into public.stops (slug, number, name, kind, start_year) values ('t-dup', 1, 'T', 'compact', 2020)$$,
  '23505', null, 'a stop number is unique');

-- Case studies: the publish gate.
insert into public.case_studies (slug, title) values ('t-gate', 'Gate');
select throws_ok(
  $$update public.case_studies set status = 'published' where slug = 't-gate'$$,
  '23514', null, 'publishing needs TL;DR bullets and outcomes');
select throws_ok(
  $$update public.case_studies set tldr = array['a','b','c','d','e'] where slug = 't-gate'$$,
  '23514', null, 'a case study never has more than 4 TL;DR bullets');
select throws_ok(
  $$update public.case_studies set status = 'published', tldr = array['a'] where slug = 't-gate'$$,
  '23514', null, 'publishing needs at least 3 sourced outcomes');
insert into public.outcomes (case_study_id, figure, description, source_kind, source_note)
  select id, g::text, 'sourced', 'own', 'test' from public.case_studies, generate_series(1, 3) g where slug = 't-gate';
select throws_ok(
  $$update public.case_studies set status = 'published', tldr = '{}' where slug = 't-gate'$$,
  '23514', null, 'publishing needs at least 1 TL;DR bullet');
select lives_ok(
  $$update public.case_studies set status = 'published', tldr = array['a','b','c','d'] where slug = 't-gate'$$,
  'publishing works with 4 bullets and 3 outcomes');
-- The removal guard locks the parent case study row before it counts, so two sessions
-- removing outcomes take turns. pgTAP runs in one transaction and cannot start a second
-- session, so the race itself is not tested here; this checks the guarded path still
-- lets a removal through while 3 outcomes remain.
insert into public.outcomes (case_study_id, figure, description, source_kind, source_note)
  select id, '4', 'fourth', 'own', 'test' from public.case_studies where slug = 't-gate';
select lives_ok(
  $$delete from public.outcomes where figure = '4' and case_study_id = (select id from public.case_studies where slug = 't-gate')$$,
  'removing a 4th outcome from a published case study is allowed');
select throws_ok(
  $$delete from public.outcomes where id = (select id from public.outcomes where case_study_id = (select id from public.case_studies where slug = 't-gate') limit 1)$$,
  '23514', null, 'an outcome cannot be removed from a published case study below 3');

select * from finish();
rollback;
