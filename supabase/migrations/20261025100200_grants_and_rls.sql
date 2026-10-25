-- Closed by default: nothing is readable or writable until a grant says so.
-- The secret key (role service_role) bypasses RLS on the server and keeps its grants.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- A table, sequence or function created later starts closed too.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;
-- PostgreSQL grants EXECUTE on every new function to PUBLIC by a global default that a
-- schema scoped revoke cannot remove, so it is revoked globally as well.
alter default privileges for role postgres
  revoke execute on functions from public;

-- Row level security on every table.
alter table public.settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.stops enable row level security;
alter table public.media enable row level security;
alter table public.lab_projects enable row level security;
alter table public.case_studies enable row level security;
alter table public.case_study_sections enable row level security;
alter table public.outcomes enable row level security;
alter table public.countries enable row level security;
alter table public.trips enable row level security;
alter table public.photos enable row level security;
alter table public.posts_cache enable row level security;
alter table public.kb_chunks enable row level security;
alter table public.assistant_evals enable row level security;

-- Public read: select only, on these tables. Policies show published rows only
-- (flags: on only). There is no insert, update or delete policy for anyone, and
-- no write grant, so a write by anon or authenticated fails with 42501.
grant select on
  public.settings, public.feature_flags, public.stops, public.media, public.lab_projects,
  public.case_studies, public.case_study_sections, public.outcomes, public.countries,
  public.trips, public.photos, public.posts_cache
  to anon, authenticated;

create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);

create policy feature_flags_public_read on public.feature_flags
  for select to anon, authenticated using (state = 'on');

create policy stops_public_read on public.stops
  for select to anon, authenticated using (status = 'published');

create policy media_public_read on public.media
  for select to anon, authenticated using (status = 'published');

create policy lab_projects_public_read on public.lab_projects
  for select to anon, authenticated using (status = 'published');

create policy case_studies_public_read on public.case_studies
  for select to anon, authenticated using (status = 'published');

-- A section is visible only with its published case study.
create policy case_study_sections_public_read on public.case_study_sections
  for select to anon, authenticated using (
    exists (
      select 1 from public.case_studies c
      where c.id = case_study_id and c.status = 'published'
    )
  );

-- An outcome is visible only with its published parent.
create policy outcomes_public_read on public.outcomes
  for select to anon, authenticated using (
    exists (select 1 from public.stops s where s.id = stop_id and s.status = 'published')
    or exists (select 1 from public.case_studies c where c.id = case_study_id and c.status = 'published')
    or exists (select 1 from public.lab_projects l where l.id = lab_project_id and l.status = 'published')
  );

create policy countries_public_read on public.countries
  for select to anon, authenticated using (status = 'published');

create policy trips_public_read on public.trips
  for select to anon, authenticated using (
    status = 'published'
    and exists (
      select 1 from public.countries c where c.id = country_id and c.status = 'published'
    )
  );

create policy photos_public_read on public.photos
  for select to anon, authenticated using (
    status = 'published'
    and exists (
      select 1 from public.trips t
      join public.countries c on c.id = t.country_id
      where t.id = trip_id and t.status = 'published' and c.status = 'published'
    )
    and exists (
      select 1 from public.media m where m.id = media_id and m.status = 'published'
    )
  );

create policy posts_cache_public_read on public.posts_cache
  for select to anon, authenticated using (status = 'published');

-- kb_chunks and assistant_evals: RLS on, no policy, no grant. Server only.
