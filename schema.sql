-- Run this in your Supabase SQL editor

create table if not exists dreams (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  region      text not null,
  lat         double precision not null,
  lon         double precision not null,
  themes      text[] not null default '{}',
  keywords    text[] default '{}',
  essence     text,
  contact     text,            -- optional pen-pal contact (email, @handle, etc.)
  created_at  timestamptz default now()
);

create table if not exists dream_connections (
  id            uuid primary key default gen_random_uuid(),
  dream_a       uuid references dreams(id) on delete cascade,
  dream_b       uuid references dreams(id) on delete cascade,
  shared_themes text[] default '{}',
  reason        text,
  strength      double precision default 0.5,
  created_at    timestamptz default now(),
  unique(dream_a, dream_b)
);

create table if not exists summaries (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  dream_count int not null default 0,
  created_at  timestamptz default now()
);

alter table dreams            enable row level security;
alter table dream_connections enable row level security;
alter table summaries         enable row level security;

create policy "public read dreams"       on dreams            for select using (true);
create policy "public read connections"  on dream_connections for select using (true);
create policy "public read summaries"    on summaries         for select using (true);
