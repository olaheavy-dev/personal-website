-- Content, shipped as a migration (decision 0019): the flagship ticket details the owner approved
-- on 27 Oct 2026 (issue #10, details PR), and Access Bank's two public sources. The Konga line is
-- public context from May 2023, after the owner left in Oct 2021, sourced to the linked article.
-- HBK's evaluation work is described by outcome only: no tool name, no internals.
-- Safe to run again, and safe on a fresh database: every statement is keyed by slug.
-- supabase/seed.sql holds the same values for local resets.

update public.stops set details = array['Built an evaluation workflow that turned AI quality questions into evidence-based decisions, and helped other teams set up their own.'] where slug = 'hbk';
update public.stops set details = array['Built the API integrations that connect Optty''s merchants to buy now, pay later providers and alternative payment methods.', 'Designed transaction tokenisation to keep payment data secure across multiple gateways.', 'Helped build configurable user experiences and reporting tools that gave the team clearer operational visibility.'] where slug = 'optty';
update public.stops set details = array['Built QuickBucks, Access Bank''s digital lending app for web and mobile, including Device Finance, which lets salaried customers buy a smartphone over 12 months.', 'Built the Device Finance vendor portal, where device partners managed their devices, customers, pickups and integrations.', 'Built the Instant Account Opening portal, automating onboarding with the Nigeria Inter-Bank Settlement System, identity verification and KYC checks.', 'Access Bank later extended QuickBucks to instalment checkout on Konga (2023).'] where slug = 'access-bank';
update public.stops set detail_sources = '[{"label": "Device Finance FAQ", "url": "https://investorrelations.accessbankplc.com/Personal-Banking/LOANS/Device-Finance.aspx"}, {"label": "Konga partnership", "url": "https://brandcom.ng/2023/05/24/access-bank-konga-partner-to-provide-installment-payments-through-pay-with-quickbucks/"}]'::jsonb where slug = 'access-bank';
