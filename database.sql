-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text CHECK (role = 'admin'::text),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  club_name text NOT NULL,
  workshop_title text NOT NULL,
  description text NOT NULL,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'::text),
  CONSTRAINT clubs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.moderators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id uuid NOT NULL,
  full_name text NOT NULL,
  CONSTRAINT moderators_pkey PRIMARY KEY (id),
  CONSTRAINT moderators_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.organizer_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  website_url text NOT NULL,
  image_url text NOT NULL,
  CONSTRAINT organizer_groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.organizer_people (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  group_id uuid NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text NOT NULL,
  linkedin_url text,
  CONSTRAINT organizer_people_pkey PRIMARY KEY (id),
  CONSTRAINT organizer_people_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.organizer_groups(id)
);
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category text NOT NULL CHECK (category = ANY (ARRAY['clubs'::text, 'media'::text, 'sponsors'::text])),
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  partner_link text,
  CONSTRAINT partners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.portfolio_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.program_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL DEFAULT 'Program'::text,
  file_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT program_files_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.timeline_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT false,
  stream_url text,
  full_name text NOT NULL,
  specialty text NOT NULL,
  organization text NOT NULL,
  photo_url text,
  linkedin_url text,
  talk_title text NOT NULL,
  description text,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(links) = 'array'::text),
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'::text),
  session_id uuid,
  CONSTRAINT timeline_cards_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_cards_session_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);

-- =============================
-- Homepage CMS controls (proposed)
-- =============================

-- Controls the main live attendance number and subtitle on '/'.
CREATE TABLE public.home_live_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  attendance_count integer NOT NULL DEFAULT 0,
  attendance_label text NOT NULL DEFAULT 'Updated in real-time'::text,
  CONSTRAINT home_live_metrics_pkey PRIMARY KEY (id)
);

-- Controls ticker lines shown in the news bar on '/'.
CREATE TABLE public.home_news_ticker_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  CONSTRAINT home_news_ticker_items_pkey PRIMARY KEY (id)
);

-- Controls "Previous editions" cards on '/'.
CREATE TABLE public.home_previous_editions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  event_date text NOT NULL,
  location text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT home_previous_editions_pkey PRIMARY KEY (id)
);