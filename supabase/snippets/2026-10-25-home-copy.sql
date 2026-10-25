-- Run once in the hosted project's SQL editor (Supabase dashboard, SQL editor), before the image
-- that contains this change is built and deployed. Sets the approved home page copy (issue #9,
-- 25 Oct 2026): six summaries, then the three shortened chip descriptions. Safe to run again:
-- it only sets the same text. Each outcome statement matches exactly one row, the first outcome
-- of its stop.

update public.stops set summary = 'Designing and building the Advantage Insights sensor-data analytics platform and the AI inside it, from Aiana to AI agents, taking features from idea to production.' where slug = 'hbk';
update public.stops set summary = 'Design and delivery of the integrations behind Optty''s payments orchestration platform, connecting merchants to buy now, pay later and local payment methods.' where slug = 'optty';
update public.stops set summary = 'Built and shipped QuickBucks and Instant Account, Access Bank''s mobile banking products, in a regulated, high-stakes production environment.' where slug = 'access-bank';
update public.lab_projects set summary = 'A personal finance workspace where AI agents check their own advice before it reaches you, and every number has a receipt.' where slug = 'foresight';
update public.lab_projects set summary = 'A production RAG system for learning FastAPI: understand, watch, practise.' where slug = 'fastpilot';
update public.lab_projects set summary = 'A home decision workspace for people buying or renting in England, at the research and concept stage.' where slug = 'homescout';
update public.outcomes set description = 'Aiana public launch' where position = 1 and figure = '2025 R4' and stop_id = (select id from public.stops where slug = 'hbk');
update public.outcomes set description = 'BNPL and local payment methods across 120+ countries' where position = 1 and figure = '90+' and stop_id = (select id from public.stops where slug = 'optty');
update public.outcomes set description = 'downloads of the QuickBucks app' where position = 1 and figure = '1M+' and stop_id = (select id from public.stops where slug = 'access-bank');
