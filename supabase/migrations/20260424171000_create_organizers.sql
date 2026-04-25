-- Organizers for `/organizers`
-- A facility/organizer group contains multiple people.

create extension if not exists "pgcrypto";

create table if not exists public.organizer_groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- stable id used by the frontend (e.g. "faculty", "university")
  slug text not null unique,

  title text not null,
  description text not null,
  website_url text not null,
  image_url text not null
);

create table if not exists public.organizer_people (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  group_id uuid not null references public.organizer_groups(id) on delete cascade,

  full_name text not null,
  role text not null,
  bio text,
  photo_url text not null,
  linkedin_url text,

  constraint organizer_people_group_name_unique unique (group_id, full_name)
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

drop trigger if exists set_organizer_groups_updated_at on public.organizer_groups;
create trigger set_organizer_groups_updated_at
before update on public.organizer_groups
for each row
execute function public.set_updated_at();

drop trigger if exists set_organizer_people_updated_at on public.organizer_people;
create trigger set_organizer_people_updated_at
before update on public.organizer_people
for each row
execute function public.set_updated_at();

