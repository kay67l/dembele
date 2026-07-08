-- Adds manual-reorder support to the executives table.
-- Run in the Supabase SQL Editor.

alter table executives add column if not exists sort_order integer not null default 0;

-- Backfill: give every existing row a sequential sort_order within its own
-- (category, subgroup) group, based on current created_at order. This also
-- neutralizes the earlier created_at-backdating hack — from here on,
-- sort_order is the real source of truth for ordering, not timestamps.
with ranked as (
  select id,
         row_number() over (
           partition by category, coalesce(subgroup, '')
           order by created_at asc
         ) - 1 as rn
  from executives
)
update executives e
set sort_order = ranked.rn
from ranked
where e.id = ranked.id;
