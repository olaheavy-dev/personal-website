-- The role the owner held at each stop, shown in the ticket eyebrow ("Senior Software Engineer
-- · via Deimos · 2022 to 2024"). Nullable and added before any code reads it, so the image
-- that is still serving keeps working (docs/database.md). A stop with no role shows years only.
alter table public.stops add column if not exists role text check (role is null or btrim(role) <> '');
