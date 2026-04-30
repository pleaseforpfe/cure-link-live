
drop policy if exists "portfolio_storage_read" on storage.objects;
drop policy if exists "portfolio_storage_insert" on storage.objects;
drop policy if exists "portfolio_storage_update" on storage.objects;
drop policy if exists "portfolio_storage_delete" on storage.objects;

create policy "portfolio_storage_read"
on storage.objects
for select
using (bucket_id = 'portfolio');

create policy "portfolio_storage_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'portfolio');

create policy "portfolio_storage_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'portfolio')
with check (bucket_id = 'portfolio');

create policy "portfolio_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'portfolio');

