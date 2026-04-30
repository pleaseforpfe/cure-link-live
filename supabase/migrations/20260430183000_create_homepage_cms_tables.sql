-- Homepage CMS controls for '/', managed from /admin/homepage-cms

create table if not exists public.home_live_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  attendance_count integer not null default 0,
  attendance_label text not null default 'Updated in real-time'
);

create table if not exists public.home_news_ticker_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz
);

create table if not exists public.home_previous_editions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  event_date text not null,
  location text not null,
  image_url text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists home_news_ticker_items_active_sort_idx
  on public.home_news_ticker_items (is_active, sort_order, updated_at desc);

create index if not exists home_previous_editions_active_sort_idx
  on public.home_previous_editions (is_active, sort_order, updated_at desc);

create index if not exists home_live_metrics_active_updated_idx
  on public.home_live_metrics (is_active, updated_at desc);
