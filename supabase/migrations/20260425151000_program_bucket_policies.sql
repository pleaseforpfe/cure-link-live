
drop policy if exists "program_storage_read" on storage.objects;
drop policy if exists "program_storage_insert" on storage.objects;
drop policy if exists "program_storage_update" on storage.objects;
drop policy if exists "program_storage_delete" on storage.objects;

create policy "program_storage_read"
on storage.objects
for select
using (bucket_id = 'program');

create policy "program_storage_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'program');

create policy "program_storage_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'program')
with check (bucket_id = 'program');

create policy "program_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'program');

-- Expose policy changes immediately in PostgREST.
select pg_notify('pgrst', 'reload schema');

