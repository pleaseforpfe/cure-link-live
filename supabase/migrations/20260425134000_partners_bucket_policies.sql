-- Public CRUD policies for storage bucket: `partners`
-- This keeps the setup simple while you are not using Supabase Auth yet.

alter table storage.objects enable row level security;

drop policy if exists "partners_storage_read" on storage.objects;
drop policy if exists "partners_storage_insert" on storage.objects;
drop policy if exists "partners_storage_update" on storage.objects;
drop policy if exists "partners_storage_delete" on storage.objects;

create policy "partners_storage_read"
on storage.objects
for select
using (bucket_id = 'partners');

create policy "partners_storage_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'partners');

create policy "partners_storage_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'partners')
with check (bucket_id = 'partners');

create policy "partners_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'partners');

-- Expose policy changes immediately in PostgREST.
select pg_notify('pgrst', 'reload schema');

