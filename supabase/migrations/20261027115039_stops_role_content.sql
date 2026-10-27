-- Content, shipped as a migration (decision 0019): the roles from the owner's CV, approved
-- 27 Oct 2026. Safe to run again, and safe on a fresh database: every statement is keyed by
-- slug. supabase/seed.sql holds the same values for local resets.

update public.stops set role = 'Technical Support Engineer' where slug = 'galooli';
update public.stops set role = 'Senior Software Engineer' where slug = 'access-bank';
update public.stops set role = 'Senior Solutions Developer' where slug = 'stanbic-ibtc';
update public.stops set role = 'Senior Software Engineer' where slug = 'optty';
update public.stops set role = 'Senior Software Engineer' where slug = 'ulesson';
update public.stops set role = 'Senior Software Engineer' where slug = 'mukuru';
update public.stops set role = 'Backend Software Engineer' where slug = 'hbk';
