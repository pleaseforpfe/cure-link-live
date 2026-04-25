-- Partners for `/partners`
-- Categories: Clubs, Media, Sponsors

create extension if not exists "pgcrypto";

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- matches the 3 sections on the page
  category text not null, -- 'clubs' | 'media' | 'sponsors'

  name text not null,
  description text not null, -- e.g. "Clinical leadership"
  image_url text not null,

  constraint partners_category_valid check (category in ('clubs', 'media', 'sponsors'))
);

create index if not exists partners_category_created_at
on public.partners (category, created_at, id);

create unique index if not exists partners_category_name_unique
on public.partners (category, name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row
execute function public.set_updated_at();
