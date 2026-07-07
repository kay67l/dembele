-- Run this in the Supabase SQL Editor for your ARSRC project.

create table if not exists executives (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('rec','zec','lit','wds','sec','adhoc')),
  subgroup    text,        -- null for REC; e.g. "Zone 1", "Editorial Committee (EDICOM)"
  name        text not null,
  role        text not null,
  school      text,
  initials    text,
  photo_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists executives_category_idx on executives (category, created_at);

-- Public (anon) can read — same as blog_posts. Writes only happen via the
-- server-side service-role key in the admin API routes, which bypasses RLS,
-- so no insert/update/delete policy is needed for anon.
alter table executives enable row level security;

create policy "Public can read executives"
  on executives for select
  using (true);

-- Photos reuse the existing `post-images` storage bucket under an
-- executives/ prefix — no new bucket needed. If your post-images bucket's
-- storage policy is scoped to a specific path prefix (e.g. only "posts/"),
-- widen it to also allow "executives/", or create a second bucket and swap
-- the ALLOWED_FOLDERS check in api/admin/upload-image.js accordingly.
