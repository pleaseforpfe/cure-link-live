-- Clubs & workshops for `/clubs`

create extension if not exists "pgcrypto";

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- card content
  club_name text not null,
  workshop_title text not null,
  description text not null,

  gallery jsonb not null default '[]'::jsonb, -- ["https://.../img1.jpg", ...]

  constraint clubs_gallery_is_array check (jsonb_typeof(gallery) = 'array')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at
before update on public.clubs
for each row
execute function public.set_updated_at();
