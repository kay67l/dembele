-- Adds a separate past_executives table — a snapshot/archive, independent
-- from the live `executives` table. Archiving copies rows in; it never
-- reads back from or modifies the current table.
-- Run in the Supabase SQL Editor.

create table if not exists past_executives (
  id          uuid primary key default gen_random_uuid(),
  year        text not null,   -- free text, e.g. "2024/2025" — covers years before this system existed
  category    text not null check (category in ('rec','zec','lit','wds','sec','adhoc')),
  subgroup    text,
  name        text not null,
  role        text not null,
  school      text,
  initials    text,
  photo_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists past_executives_year_idx on past_executives (year, category, subgroup);

alter table past_executives enable row level security;

create policy "Public can read past executives"
  on past_executives for select
  using (true);
