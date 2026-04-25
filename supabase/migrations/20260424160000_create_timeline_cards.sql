-- Timeline cards for `/timeline`
-- Stores the same data currently hardcoded in `src/data/speakers.ts`,
-- but in a dynamic, manageable Supabase Postgres table.

create extension if not exists "pgcrypto";

create table if not exists public.timeline_cards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- display ordering within the timeline list
  sort_order integer not null default 0,
  -- exactly one session can be live at a time
  is_live boolean not null default false,
  stream_url text, -- used for "Watch Live →" button when `is_live = true`

  -- speaker / person
  full_name text not null,
  specialty text not null,
  organization text not null, -- e.g. hospital/university: "Stanford"
  photo_url text, -- URL (Supabase Storage public URL or external)
  linkedin_url text,

  -- session
  talk_title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,

  -- extra content for the expanded card UI
  links jsonb not null default '[]'::jsonb,   -- [{ "label": "...", "url": "..." }]
  gallery jsonb not null default '[]'::jsonb, -- ["https://.../img1.jpg", ...]

  constraint timeline_cards_ends_after_starts check (ends_at > starts_at),
  constraint timeline_cards_links_is_array check (jsonb_typeof(links) = 'array'),
  constraint timeline_cards_gallery_is_array check (jsonb_typeof(gallery) = 'array')
);

-- allow only one `is_live = true` row at a time
create unique index if not exists timeline_cards_only_one_live
on public.timeline_cards (is_live)
where is_live;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timeline_cards_updated_at on public.timeline_cards;
create trigger set_timeline_cards_updated_at
before update on public.timeline_cards
for each row
execute function public.set_updated_at();
