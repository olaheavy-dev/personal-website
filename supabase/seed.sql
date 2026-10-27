-- Seed for the claims policy (decision 0005). Safe to run more than once.
-- Settings and flags are owner-edited later, so a re-run never overwrites them;
-- content rows are refreshed. Every link was re-opened on 2026-10-25 (checked_on).
-- The HBK release notes link blocks automated requests, so the owner opened it in a
-- browser on 2026-10-25 and confirmed 2025 R4 still mentions Aiana.
-- Never here: phone, address, email, CV only dates, titles or figures, RagLab.

-- Settings (mirror src/lib/site.ts). Social links start empty: the owner fills them in.
insert into public.settings (key, value) values
  ('site.name', '"Sunkanmi Olawuwo"'),
  ('site.first_name', '"Sunkanmi"'),
  ('site.url', '"https://olaheavy.dev"'),
  ('site.one_liner', '"I take products from idea to production, with AI built in."'),
  ('site.description', to_jsonb('Full-stack & AI engineer based in the UK. Ten years of software across banking, cross-border payments and edtech; today helping build HBK''s sensor-data analytics platform and the human-centred AI inside it.'::text)),
  ('site.availability', to_jsonb(E'Open to senior & staff AI roles\u00a0\u00b7 consulting'::text)),
  ('site.time_zone', '"Europe/London"'),
  ('site.time_zone_label', '"UK"'),
  ('site.copyright_since', '2026'),
  ('site.resume_url', 'null'),
  ('profile.github', '{"label": "GitHub", "url": null}'),
  ('profile.linkedin', '{"label": "LinkedIn", "url": null}'),
  ('profile.hashnode', '{"label": "Hashnode", "url": null}'),
  ('profile.x', '{"label": "X", "url": null}')
on conflict (key) do nothing;

-- Feature flags: only the home page is on.
insert into public.feature_flags (key, state) values
  ('page.home', 'on'),
  ('page.work', 'off'),
  ('page.lab', 'off'),
  ('page.writing', 'off'),
  ('page.travel', 'off'),
  ('page.about', 'off'),
  ('case.hbk-aiana', 'off'),
  ('case.optty', 'off'),
  ('case.access-bank', 'off'),
  ('case.foresight', 'off'),
  ('feature.assistant', 'off'),
  ('feature.passport', 'off'),
  ('feature.cmdk', 'off'),
  ('feature.globe3d', 'off')
on conflict (key) do nothing;

-- Stops 01 to 07, years only.
insert into public.stops (slug, number, name, kind, filters, start_year, end_year, via, status) values
  ('galooli', 1, 'Galooli', 'compact', '{data_iot}', 2016, 2018, null, 'published'),
  ('access-bank', 2, 'Access Bank', 'flagship', '{payments}', 2018, 2021, null, 'published'),
  ('stanbic-ibtc', 3, 'Stanbic IBTC', 'compact', '{payments}', 2021, 2022, null, 'published'),
  ('optty', 4, 'Optty', 'flagship', '{payments}', 2022, 2024, 'Deimos', 'published'),
  ('ulesson', 5, 'uLesson', 'compact', '{edtech}', 2022, 2024, 'Deimos', 'published'),
  ('mukuru', 6, 'Mukuru', 'compact', '{payments}', 2022, 2024, 'Deimos', 'published'),
  ('hbk', 7, 'HBK', 'flagship', '{ai,data_iot}', 2024, null, null, 'published')
on conflict (slug) do update set
  number = excluded.number, name = excluded.name, kind = excluded.kind,
  filters = excluded.filters, start_year = excluded.start_year,
  end_year = excluded.end_year, via = excluded.via, status = excluded.status;

-- Roles from the owner's CV (27 Oct 2026). The same statements are in
-- supabase/migrations/20261027115039_stops_role_content.sql for the hosted project.
update public.stops set role = 'Technical Support Engineer' where slug = 'galooli';
update public.stops set role = 'Senior Software Engineer' where slug = 'access-bank';
update public.stops set role = 'Senior Solutions Developer' where slug = 'stanbic-ibtc';
update public.stops set role = 'Senior Software Engineer' where slug = 'optty';
update public.stops set role = 'Senior Software Engineer' where slug = 'ulesson';
update public.stops set role = 'Senior Software Engineer' where slug = 'mukuru';
update public.stops set role = 'Backend Software Engineer' where slug = 'hbk';

-- Four case studies as drafts, section titles only. Flags decide visibility later.
insert into public.case_studies (slug, stop_id, title, status) values
  ('hbk-aiana', (select id from public.stops where slug = 'hbk'), 'HBK Advantage Aiana', 'draft'),
  ('optty', (select id from public.stops where slug = 'optty'), 'Optty payments orchestration', 'draft'),
  ('access-bank', (select id from public.stops where slug = 'access-bank'), 'Access Bank QuickBucks and Instant Account', 'draft'),
  ('foresight', null, 'Foresight', 'draft')
on conflict (slug) do update set stop_id = excluded.stop_id, title = excluded.title;

insert into public.case_study_sections (case_study_id, anchor, position, title)
select c.id, s.anchor::public.section_anchor, s.position, s.title
from public.case_studies c
cross join (values
  ('context', 1, 'Context and problem'),
  ('design', 2, 'Design decision'),
  ('architecture', 3, 'Architecture'),
  ('production', 4, 'Shipping to production'),
  ('tradeoffs', 5, 'Trade-off or incident'),
  ('results', 6, 'Results'),
  ('reflection', 7, 'What I would do differently')
) as s (anchor, position, title)
where c.slug in ('hbk-aiana', 'optty', 'access-bank', 'foresight')
on conflict (case_study_id, anchor) do update set position = excluded.position, title = excluded.title;

-- Lab: Foresight (live URL), FastPilot (no live demo link), HomeScout and SabiTutor (in progress).
insert into public.lab_projects
  (slug, name, in_progress, repo_url, live_url, video_url, case_study_id, links_checked_on, position, status)
values
  ('foresight', 'Foresight', false, 'https://github.com/olaheavy-dev/Foresight', 'https://foresight.olaheavy.dev', null,
    (select id from public.case_studies where slug = 'foresight'), date '2026-10-25', 1, 'published'),
  ('fastpilot', 'FastPilot', false, 'https://github.com/olaheavy-dev/fastpilot', null, 'https://www.loom.com/share/a1d6bf3ee7c54e5c93de4ac8c280992f',
    null, date '2026-10-25', 2, 'published'),
  ('homescout', 'HomeScout', true, 'https://github.com/olaheavy-dev/homescout-platform', null, null,
    null, date '2026-10-25', 3, 'published'),
  ('sabitutor', 'SabiTutor', true, null, null, null,
    null, null, 4, 'published')
on conflict (slug) do update set
  name = excluded.name, in_progress = excluded.in_progress, repo_url = excluded.repo_url,
  live_url = excluded.live_url, video_url = excluded.video_url,
  case_study_id = excluded.case_study_id, links_checked_on = excluded.links_checked_on,
  position = excluded.position, status = excluded.status;

-- Home copy, approved by the owner on 25 Oct 2026 (issue #9). No pronouns. The same statements
-- (except the HBK and Mukuru lines, which are from 26 Oct 2026, issue #102, and live in
-- supabase/migrations/20261026132128_selected_stops_content.sql) are in supabase/snippets/2026-10-25-home-copy.sql
-- for a hosted project that was seeded before this copy existed, because `db push --include-seed`
-- skips a seed that has changed.
update public.stops set summary = 'Designing and building HBK''s sensor-data analytics platform for test, durability and fatigue engineers, and the AI inside it: from Aiana, the docs assistant, to AI agents for features like Python code suggestions and file data analysis.' where slug = 'hbk';
update public.stops set summary = 'Integrations that land Mukuru''s cross-border transfers in Malawian mobile money wallets, with USSD payment flows built to handle errors and retries.' where slug = 'mukuru';
update public.stops set summary = 'Design and delivery of the integrations behind Optty''s payments orchestration platform, connecting merchants to buy now, pay later and local payment methods.' where slug = 'optty';
update public.stops set summary = 'Built and shipped QuickBucks and Instant Account, Access Bank''s mobile banking products, in a regulated, high-stakes production environment.' where slug = 'access-bank';
update public.lab_projects set summary = 'A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.' where slug = 'foresight';
update public.lab_projects set summary = 'A production RAG system for learning FastAPI: understand, watch, practise.' where slug = 'fastpilot';
update public.lab_projects set summary = 'A home decision workspace for people buying or renting in England, at the research and concept stage.' where slug = 'homescout';

-- Outcomes: only what the claims policy allows. None for Stanbic IBTC or uLesson.
delete from public.outcomes
where stop_id in (select id from public.stops where slug in ('access-bank', 'optty', 'galooli', 'hbk', 'mukuru'))
   or lab_project_id in (select id from public.lab_projects where slug in ('foresight', 'fastpilot'));

insert into public.outcomes
  (stop_id, lab_project_id, position, figure, description, source_kind, source_label, source_url, checked_on, claim_scope, attribution, as_of_year)
values
  ((select id from public.stops where slug = 'access-bank'), null, 1,
    '1M+', 'downloads of the QuickBucks app',
    'link', 'Google Play listing', 'https://play.google.com/store/apps/details?id=com.accessbankplc.quickbucks', date '2026-10-25',
    'company', 'Google Play', 2026),
  ((select id from public.stops where slug = 'optty'), null, 1,
    '90+', 'BNPL and local payment methods across 120+ countries',
    'link', 'Optty and Triple-A announcement, 2023', 'https://triple-a.io/newsroom/optty-partners-with-triple-a-to-expand-payment-architectures-into-digital-currencies', date '2026-10-25',
    'company', 'Optty', 2023),
  ((select id from public.stops where slug = 'galooli'), null, 1,
    '~11%', 'fuel saving across several hundred sites in Nigeria, reported by Galooli',
    'link', 'Galooli Nigeria case study', 'https://galooli.com/case-studies/deep-dive-into-remote-site-energy-use/', date '2026-10-25',
    'company', 'Galooli', 2021),
  ((select id from public.stops where slug = 'mukuru'), null, 1,
    '17M+', 'customers served',
    'link', 'Techzim, 20 years of Mukuru', 'https://techzim.co.zw/2025/03/20years-mukuru-milestones-that-shaped-journey', date '2026-10-26',
    'company', 'Mukuru', 2025),
  ((select id from public.stops where slug = 'hbk'), null, 1,
    '2025 R4', 'Aiana public launch',
    'link', 'HBK Advantage Insights release notes', 'https://www.hbkworld.com/en/products/support-resources/release-notes/advantage-insights', date '2026-10-25',
    'company', 'HBK', 2025),
  (null, (select id from public.lab_projects where slug = 'foresight'), 1,
    '17', 'evaluation suites',
    'link', 'Foresight repository README', 'https://github.com/olaheavy-dev/Foresight', date '2026-10-25',
    'personal', null, null),
  (null, (select id from public.lab_projects where slug = 'fastpilot'), 1,
    '0.992', 'answer faithfulness, scored by an LLM judge in production',
    'link', 'FastPilot repository README', 'https://github.com/olaheavy-dev/fastpilot', date '2026-10-25',
    'personal', null, null),
  (null, (select id from public.lab_projects where slug = 'fastpilot'), 2,
    '~210', 'tests',
    'link', 'FastPilot repository README', 'https://github.com/olaheavy-dev/fastpilot', date '2026-10-25',
    'personal', null, null),
  (null, (select id from public.lab_projects where slug = 'fastpilot'), 3,
    '90%', 'coverage gate enforced in CI',
    'link', 'FastPilot repository README', 'https://github.com/olaheavy-dev/fastpilot', date '2026-10-25',
    'personal', null, null);

-- Countries: Nigeria is home. No trips or photos yet.
insert into public.countries (slug, name, iso2, is_home, visited_year, status) values
  ('nigeria', 'Nigeria', 'NG', true, null, 'published'),
  ('united-kingdom', 'United Kingdom', 'GB', false, 2022, 'published'),
  ('albania', 'Albania', 'AL', false, 2026, 'published')
on conflict (slug) do update set
  name = excluded.name, iso2 = excluded.iso2, is_home = excluded.is_home,
  visited_year = excluded.visited_year, status = excluded.status;
