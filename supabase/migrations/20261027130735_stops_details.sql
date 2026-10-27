-- Up to four short lines of detail per stop, shown when a compact ticket on /work expands.
-- Added before any code reads it, with a default, so the image that is still serving keeps
-- working (docs/database.md). The check keeps a ticket from growing past four lines.
alter table public.stops
  add column if not exists details text[] not null default '{}';

alter table public.stops
  drop constraint if exists stops_details_max_four;
alter table public.stops
  add constraint stops_details_max_four check (cardinality(details) <= 4);
