-- Content, shipped as a migration (decision 0019): the Work page copy the owner approved on
-- 27 Oct 2026 (issue #10, PR 1). Summaries for Galooli, Stanbic IBTC and uLesson, details for
-- Galooli, Stanbic IBTC, uLesson and Mukuru, and Galooli's outcome description without
-- "reported by Galooli" (the credit already attributes it).
-- Safe to run again, and safe on a fresh database: every statement is keyed by slug.
-- supabase/seed.sql holds the same values for local resets.

update public.stops set summary = 'Field deployment and support of Galooli''s IoT energy management for telecom tower sites across Nigeria.' where slug = 'galooli';
update public.stops set summary = 'Digital banking products in Stanbic IBTC''s Innovation Lab, built on open banking APIs with fintech partners.' where slug = 'stanbic-ibtc';
update public.stops set summary = 'Web platform work for uLesson''s learning app: a redesign, faster pages and better observability.' where slug = 'ulesson';

update public.stops set details = array['Deployed IoT energy management for telecom tower operators across Nigeria.', 'Delivered the analytics dashboards clients used to track energy use and running costs.'] where slug = 'galooli';
update public.stops set details = array['Redesigned the Personal Finance Manager across web and mobile, with better accessibility and deeper links to digital banking APIs.', 'Added retries and background processing to EZ Cash so fewer transactions failed.', 'Turned business ideas into secure digital products alongside product and business teams.', 'Mentored junior engineers on the team.'] where slug = 'stanbic-ibtc';
update public.stops set details = array['Redesigned the uLesson web platform so pages load faster and learning flows read more clearly.', 'Built observability and logging that made production problems quicker to find and fix.', 'Improved the front end and back end across learning workflows and platform reliability.'] where slug = 'ulesson';
update public.stops set details = array['Integrated mobile wallet providers and Malawi''s national payment switch so remittances reach wallets.', 'Built USSD flows that handle errors and retry, for customers on basic phones.', 'Added value-added services for remittance customers alongside transfers.'] where slug = 'mukuru';

update public.outcomes set description = 'fuel saving across several hundred sites in Nigeria' where position = 1 and stop_id = (select id from public.stops where slug = 'galooli');
