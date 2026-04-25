-- Storage policies for bucket: `timeline`
-- Goal: allow CRUD for timeline session images, with folder naming based on doctor name.
--
-- Folder convention enforced by policy:
--   <doctor-slug>/<timeline_card_id>/<filename>
-- Example:
--   dr-marcus-chen/0f3d5c7a-0c2c-4f7f-a9af-0b1b3f9d2e10/photo.png
--
-- Notes:
-- - If you don't use Supabase Auth yet, you can change `to authenticated`
--   to `to anon, authenticated` to allow public uploads/updates/deletes.
-- - Requires `pgcrypto` (already used in your migrations).

create extension if not exists "pgcrypto";

-- Helper: slugify a doctor's full name into a stable folder token.
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select
    regexp_replace(
      regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    );
$$;

-- Ensure storage objects are protected by RLS.
alter table storage.objects enable row level security;

-- Remove old policies if they exist (safe to re-run).
drop policy if exists "timeline_storage_read" on storage.objects;
drop policy if exists "timeline_storage_insert" on storage.objects;
drop policy if exists "timeline_storage_update" on storage.objects;
drop policy if exists "timeline_storage_delete" on storage.objects;

-- Public read/list/download for bucket `timeline`.
create policy "timeline_storage_read"
on storage.objects
for select
using (bucket_id = 'timeline');

-- Insert (upload) allowed when object path matches the session:
-- <slug(full_name)>/<id>/...
create policy "timeline_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'timeline'
  and exists (
    select 1
    from public.timeline_cards tc
    where tc.id::text = split_part(name, '/', 2)
      and public.slugify(tc.full_name) = split_part(name, '/', 1)
  )
);

-- Update supports rename/move inside the same allowed folder.
create policy "timeline_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'timeline'
  and exists (
    select 1
    from public.timeline_cards tc
    where tc.id::text = split_part(name, '/', 2)
      and public.slugify(tc.full_name) = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'timeline'
  and exists (
    select 1
    from public.timeline_cards tc
    where tc.id::text = split_part(name, '/', 2)
      and public.slugify(tc.full_name) = split_part(name, '/', 1)
  )
);

-- Delete (remove) allowed for session files in the allowed folder.
create policy "timeline_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'timeline'
  and exists (
    select 1
    from public.timeline_cards tc
    where tc.id::text = split_part(name, '/', 2)
      and public.slugify(tc.full_name) = split_part(name, '/', 1)
  )
);

