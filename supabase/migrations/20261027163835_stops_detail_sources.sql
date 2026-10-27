-- Public sources for a stop's detail lines, shown as a "Sources" row when its ticket expands:
-- a list of {label, url} objects. Added before any code reads it, with a default, so the image
-- that is still serving keeps working (docs/database.md, decision 0019). The check keeps every
-- item a non empty label with an https link.
alter table public.stops
  add column if not exists detail_sources jsonb not null default '[]'::jsonb;

alter table public.stops
  drop constraint if exists stops_detail_sources_shape;
-- Every item must pass the filter, so the count of passing items equals the count of items. A
-- missing or wrongly typed key never passes, whatever the other keys hold.
alter table public.stops
  add constraint stops_detail_sources_shape check (
    case
      when jsonb_typeof(detail_sources) = 'array' then
        jsonb_array_length(detail_sources) = jsonb_array_length(
          jsonb_path_query_array(
            detail_sources,
            '$[*] ? (@.type() == "object" && @.label.type() == "string" && @.label != "" && @.url.type() == "string" && @.url like_regex "^https://.+")'
          )
        )
      else false
    end
  );
