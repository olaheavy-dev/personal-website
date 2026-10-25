-- Extensions, enums and shared helpers. Tables come next, then grants and RLS.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create type public.content_status as enum ('draft', 'published');
create type public.flag_state as enum ('on', 'preview', 'off');
create type public.stop_kind as enum ('flagship', 'compact');
-- The four Work filter chips. data_iot is the URL value data-iot (?filter=).
create type public.stop_filter as enum ('ai', 'payments', 'data_iot', 'edtech');
-- Stable section anchors of a case study (#context, #design, ...).
create type public.section_anchor as enum (
  'context', 'design', 'architecture', 'production', 'tradeoffs', 'results', 'reflection'
);
-- Mirrors MetricSource in src/components/ticket/SourceDisclosure.tsx.
create type public.source_kind as enum ('link', 'own');
create type public.claim_scope as enum ('personal', 'company');
create type public.kb_source_type as enum ('stop', 'case_study', 'lab_project', 'post', 'page');
create type public.media_kind as enum ('image', 'gif', 'video');

-- Keeps updated_at honest on every table that has the column.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
