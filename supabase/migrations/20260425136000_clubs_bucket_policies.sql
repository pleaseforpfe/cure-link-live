-- Public CRUD policies for storage bucket: `clubs`
-- This keeps the setup simple while you are not using Supabase Auth yet.

alter table storage.objects enable row level security;

drop policy if exists "clubs_storage_read" on storage.objects;
drop policy if exists "clubs_storage_insert" on storage.objects;
drop policy if exists "clubs_storage_update" on storage.objects;
drop policy if exists "clubs_storage_delete" on storage.objects;

create policy "clubs_storage_read"
on storage.objects
for select
using (bucket_id = 'clubs');

create policy "clubs_storage_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'clubs');

create policy "clubs_storage_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'clubs')
with check (bucket_id = 'clubs');

create policy "clubs_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'clubs');

select pg_notify('pgrst', 'reload schema');

