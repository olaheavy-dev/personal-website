-- Tables, constraints, triggers and indexes. Grants and RLS are in the next migration.
-- A check passes when its expression is null, so every rule that needs a value says
-- "is not null" explicitly.

-- Site settings (key/value). The values mirror src/lib/site.ts.
create table public.settings (
  key text primary key check (key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Feature flags (decision 0006). A row that is missing counts as off.
create table public.feature_flags (
  key text primary key check (key ~ '^(page|case|feature)\.[a-z0-9]+(-[a-z0-9]+)*$'),
  state public.flag_state not null default 'off',
  updated_at timestamptz not null default now(),
  constraint feature_flags_home_always_on check (key <> 'page.home' or state = 'on')
);

create function public.protect_home_flag()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.key = 'page.home' then
    raise exception 'The page.home flag cannot be deleted' using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

create trigger feature_flags_protect_home
  before delete on public.feature_flags
  for each row execute function public.protect_home_flag();

-- Stops on the route: jobs and engagements. Years only, no role titles.
create table public.stops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  number smallint not null unique check (number between 1 and 99),
  name text not null check (btrim(name) <> ''),
  kind public.stop_kind not null,
  filters public.stop_filter[] not null default '{}',
  start_year smallint not null check (start_year between 2000 and 2100),
  end_year smallint check (end_year between 2000 and 2100),
  via text,
  summary text,
  stack text[] not null default '{}',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stops_years_in_order check (end_year is null or end_year >= start_year)
);

-- Media. Alt text is required before publishing; AI generated images need a caption.
create table public.media (
  id uuid primary key default gen_random_uuid(),
  kind public.media_kind not null,
  storage_path text not null unique check (btrim(storage_path) <> ''),
  alt text,
  caption text,
  is_ai_generated boolean not null default false,
  width integer check (width > 0),
  height integer check (height > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_alt_on_publish check (status <> 'published' or nullif(btrim(alt), '') is not null),
  constraint media_ai_captioned check (not is_ai_generated or nullif(btrim(caption), '') is not null)
);

create table public.lab_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  summary text,
  in_progress boolean not null default false,
  repo_url text check (repo_url ~ '^https://'),
  live_url text check (live_url ~ '^https://'),
  demo_url text check (demo_url ~ '^https://'),
  video_url text check (video_url ~ '^https://'),
  writeup_url text check (writeup_url ~ '^https://'),
  case_study_id uuid,
  links_checked_on date,
  position smallint not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- RagLab is work-related and is never shown as a personal project (decision 0005).
  constraint lab_projects_not_raglab check (lower(slug) <> 'raglab' and lower(name) <> 'raglab')
);

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  stop_id uuid unique references public.stops (id) on delete set null,
  title text not null check (btrim(title) <> ''),
  tldr text[] not null default '{}',
  hero_media_id uuid references public.media (id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_studies_tldr_max check (cardinality(tldr) <= 4)
);

alter table public.lab_projects
  add constraint lab_projects_case_study_fk
  foreign key (case_study_id) references public.case_studies (id) on delete set null;

create table public.case_study_sections (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies (id) on delete cascade,
  anchor public.section_anchor not null,
  position smallint not null check (position between 1 and 7),
  title text not null check (btrim(title) <> ''),
  body text,
  updated_at timestamptz not null default now(),
  unique (case_study_id, anchor),
  unique (case_study_id, position)
);

-- Sourced figures. Exactly one parent; the source is required by constraints
-- (decision 0005): a link needs an https URL and a label, an own measurement needs a note.
create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid references public.stops (id) on delete cascade,
  case_study_id uuid references public.case_studies (id) on delete cascade,
  lab_project_id uuid references public.lab_projects (id) on delete cascade,
  position smallint not null default 0,
  figure text not null check (btrim(figure) <> ''),
  description text not null check (btrim(description) <> ''),
  source_kind public.source_kind not null,
  source_label text,
  source_url text,
  source_note text,
  checked_on date,
  claim_scope public.claim_scope not null default 'personal',
  attribution text,
  as_of_year smallint check (as_of_year between 2000 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outcomes_one_parent check (num_nonnulls(stop_id, case_study_id, lab_project_id) = 1),
  constraint outcomes_source check (
    (
      source_kind = 'link'
      and source_url is not null and source_url ~ '^https://'
      and nullif(btrim(source_label), '') is not null
      and source_note is null
      and checked_on is not null
    )
    or (
      source_kind = 'own'
      and nullif(btrim(source_note), '') is not null
      and source_url is null
    )
  ),
  constraint outcomes_company_claim check (
    claim_scope <> 'company'
    or (nullif(btrim(attribution), '') is not null and as_of_year is not null)
  )
);

create index outcomes_stop_idx on public.outcomes (stop_id);
create index outcomes_case_study_idx on public.outcomes (case_study_id);
create index outcomes_lab_project_idx on public.outcomes (lab_project_id);
create index case_studies_hero_media_idx on public.case_studies (hero_media_id);
create index lab_projects_case_study_idx on public.lab_projects (case_study_id);

-- Publish gate: 1 to 4 TL;DR bullets and at least 3 sourced outcomes.
create function public.enforce_case_study_publish_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if cardinality(new.tldr) not between 1 and 4 then
      raise exception 'A published case study needs 1 to 4 TL;DR bullets' using errcode = 'check_violation';
    end if;
    if (select count(*) from public.outcomes where case_study_id = new.id) < 3 then
      raise exception 'A published case study needs at least 3 sourced outcomes' using errcode = 'check_violation';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger case_studies_publish_gate
  before insert or update on public.case_studies
  for each row execute function public.enforce_case_study_publish_gate();

-- The gate also holds after publishing: an outcome cannot be removed or moved away
-- from a published case study if that leaves fewer than 3.
create function public.protect_published_case_study_outcomes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.case_study_id is not null
     and (tg_op = 'DELETE' or new.case_study_id is distinct from old.case_study_id)
     and exists (
       select 1 from public.case_studies
       where id = old.case_study_id and status = 'published'
     )
     and (
       select count(*) from public.outcomes
       where case_study_id = old.case_study_id and id <> old.id
     ) < 3
  then
    raise exception 'A published case study needs at least 3 sourced outcomes' using errcode = 'check_violation';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger outcomes_protect_published
  before update or delete on public.outcomes
  for each row execute function public.protect_published_case_study_outcomes();

-- Travel: country, trip, photo. Photos carry no coordinates.
create table public.countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  iso2 char(2) not null unique check (iso2 ~ '^[A-Z]{2}$'),
  is_home boolean not null default false,
  visited_year smallint check (visited_year between 1900 and 2100),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly one home country.
create unique index countries_one_home on public.countries (is_home) where is_home;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (btrim(title) <> ''),
  year smallint not null check (year between 1900 and 2100),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, slug)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  media_id uuid not null unique references public.media (id) on delete cascade,
  caption text,
  position smallint not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_country_idx on public.trips (country_id);
create index photos_trip_idx on public.photos (trip_id);

-- Hashnode posts, cached for the Writing page (decision 0008).
create table public.posts_cache (
  id uuid primary key default gen_random_uuid(),
  hashnode_id text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (btrim(title) <> ''),
  excerpt text,
  cover_url text check (cover_url ~ '^https://'),
  canonical_url text check (canonical_url ~ '^https://'),
  tags text[] not null default '{}',
  reading_minutes smallint check (reading_minutes > 0),
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  status public.content_status not null default 'published'
);

-- Assistant knowledge base (decision 0009). Server only: voyage-4-lite embeddings.
create table public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_type public.kb_source_type not null,
  source_ref text not null check (btrim(source_ref) <> ''),
  chunk_index integer not null check (chunk_index >= 0),
  anchor text,
  content text not null check (btrim(content) <> ''),
  content_hash text not null,
  embedding extensions.vector(1024) not null,
  fts tsvector generated always as (to_tsvector('english'::regconfig, content)) stored,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (source_type, source_ref, chunk_index)
);

create index kb_chunks_embedding_idx on public.kb_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index kb_chunks_fts_idx on public.kb_chunks using gin (fts);

-- Questions the assistant is scored against. Server only.
create table public.assistant_evals (
  id uuid primary key default gen_random_uuid(),
  question text not null check (btrim(question) <> ''),
  expected_sources text[] not null default '{}',
  notes text,
  should_refuse boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger feature_flags_set_updated_at before update on public.feature_flags
  for each row execute function public.set_updated_at();
create trigger stops_set_updated_at before update on public.stops
  for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media
  for each row execute function public.set_updated_at();
create trigger lab_projects_set_updated_at before update on public.lab_projects
  for each row execute function public.set_updated_at();
create trigger case_studies_set_updated_at before update on public.case_studies
  for each row execute function public.set_updated_at();
create trigger case_study_sections_set_updated_at before update on public.case_study_sections
  for each row execute function public.set_updated_at();
create trigger outcomes_set_updated_at before update on public.outcomes
  for each row execute function public.set_updated_at();
create trigger countries_set_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
create trigger trips_set_updated_at before update on public.trips
  for each row execute function public.set_updated_at();
create trigger photos_set_updated_at before update on public.photos
  for each row execute function public.set_updated_at();
create trigger kb_chunks_set_updated_at before update on public.kb_chunks
  for each row execute function public.set_updated_at();
