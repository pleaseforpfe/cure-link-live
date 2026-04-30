-- Reset script: clear all sessions, moderators, and programs
-- WARNING: This will delete all data in these tables

-- Delete all timeline_cards (programs)
DELETE FROM public.timeline_cards;

-- Delete all moderators
DELETE FROM public.moderators;

-- Delete all sessions
DELETE FROM public.sessions;

-- Reset sequences if needed (PostgreSQL auto-increment)
ALTER SEQUENCE IF EXISTS public.timeline_cards_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.moderators_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.sessions_id_seq RESTART WITH 1;

-- Optional: Clear storage bucket
-- Note: Use Supabase dashboard or API to clear the bucket contents
-- Files in storage/timeline/* should be manually deleted via dashboard
