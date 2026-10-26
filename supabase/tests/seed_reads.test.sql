begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 8: what the typed queries read is in the seed, for the public roles.

set local role anon;

select is((select count(*) from public.stops), 7::bigint, 'anon reads the 7 stops');
select is((select count(*) from public.outcomes where stop_id is not null), 5::bigint, 'anon reads the 5 stop outcomes');
select is((select count(*) from public.outcomes where lab_project_id is not null), 4::bigint, 'anon reads the 4 lab outcomes');
select is((select count(*) from public.lab_projects), 4::bigint, 'anon reads the 4 lab projects');
select is((select count(*) from public.countries), 3::bigint, 'anon reads the 3 countries');
select is((select count(*) from public.case_studies), 0::bigint, 'anon reads no draft case studies');
select is((select count(*) from public.feature_flags), 1::bigint, 'anon reads one flag: page.home');
select is((select count(*) from public.settings), 14::bigint, 'anon reads the settings');
select is(
  (select value #>> '{}' from public.settings where key = 'site.name'),
  'Sunkanmi Olawuwo',
  'the site name is readable'
);

reset role;
select * from finish();
rollback;
