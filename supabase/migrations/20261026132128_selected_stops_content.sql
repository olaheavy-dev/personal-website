-- Content, shipped as a migration (decision 0019): the owner approved copy of 26 Oct 2026
-- (issue #102). The HBK and Mukuru summaries and Mukuru's one sourced figure.
-- Safe to run again, and safe on a fresh database: every statement is keyed by slug, so before
-- the seed has run it changes nothing. supabase/seed.sql holds the same values for local resets.

update public.stops set summary = 'Designing and building HBK''s sensor-data analytics platform for test, durability and fatigue engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like Python code suggestions and file data analysis.' where slug = 'hbk';
update public.stops set summary = 'Integrations that land Mukuru''s cross-border transfers in Malawian mobile money wallets, with USSD payment flows built to handle errors and retries.' where slug = 'mukuru';

delete from public.outcomes where stop_id = (select id from public.stops where slug = 'mukuru');

insert into public.outcomes
  (stop_id, lab_project_id, position, figure, description, source_kind, source_label, source_url, checked_on, claim_scope, attribution, as_of_year)
select
  id, null, 1,
  '17M+', 'customers served',
  'link', 'Techzim, 20 years of Mukuru', 'https://techzim.co.zw/2025/03/20years-mukuru-milestones-that-shaped-journey', date '2026-10-26',
  'company', 'Mukuru', 2025
from public.stops where slug = 'mukuru';
