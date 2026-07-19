-- Run in Supabase SQL editor

-- Per-zone content: slogan + logo, one row per zone (seeded below)
create table if not exists engagement_zones (
  zone_key text primary key check (zone_key in ('z1','z2','z3','z4')),
  slogan text,
  logo_url text,
  updated_at timestamptz not null default now()
);
insert into engagement_zones (zone_key) values ('z1'),('z2'),('z3'),('z4')
  on conflict (zone_key) do nothing;

-- Schools per zone (replaces the hardcoded list in student-engagement.html)
create table if not exists engagement_schools (
  id uuid primary key default gen_random_uuid(),
  zone_key text not null check (zone_key in ('z1','z2','z3','z4')),
  school_type text not null check (school_type in ('shs','tech')),
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_engagement_schools_zone on engagement_schools(zone_key, school_type);

-- Student photo placeholders per zone (real photos, admin-uploaded)
create table if not exists engagement_students (
  id uuid primary key default gen_random_uuid(),
  zone_key text not null check (zone_key in ('z1','z2','z3','z4')),
  name text,
  photo_url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_engagement_students_zone on engagement_students(zone_key);

-- WDS / LG events — each can carry multiple photos
create table if not exists engagement_events (
  id uuid primary key default gen_random_uuid(),
  wing text not null check (wing in ('wds','lg')),
  title text not null,
  description text,
  photo_urls jsonb not null default '[]'::jsonb,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_engagement_events_wing on engagement_events(wing);

-- RLS: public can read all four, only server-side (service role) admin endpoints can write
alter table engagement_zones    enable row level security;
alter table engagement_schools  enable row level security;
alter table engagement_students enable row level security;
alter table engagement_events   enable row level security;

create policy "Public read zones"    on engagement_zones    for select using (true);
create policy "Public read schools"  on engagement_schools  for select using (true);
create policy "Public read students" on engagement_students for select using (true);
create policy "Public read events"   on engagement_events   for select using (true);
