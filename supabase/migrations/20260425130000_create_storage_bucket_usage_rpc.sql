-- Storage usage helper for Admin Overview.
-- Provides accurate bucket size + file count without needing client-side recursive listing.

create or replace function public.storage_bucket_usage(p_bucket text)
returns table (
  bucket text,
  total_bytes bigint,
  files bigint
)
language sql
security definer
set search_path = public, storage
as $$
  select
    p_bucket as bucket,
    coalesce(
      sum(
        case
          when (o.metadata->>'size') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint
          else 0
        end
      ),
      0
    ) as total_bytes,
    count(*) as files
  from storage.objects o
  where o.bucket_id = p_bucket;
$$;

grant execute on function public.storage_bucket_usage(text) to anon, authenticated;

-- Ensure the RPC endpoint appears immediately (prevents /rpc/... 404 from schema cache).
select pg_notify('pgrst', 'reload schema');

