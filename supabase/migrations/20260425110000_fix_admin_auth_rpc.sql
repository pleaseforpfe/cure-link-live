-- Fix admin RPC functions for Supabase environments where pgcrypto is installed in `extensions`
-- and PostgREST needs a schema cache reload to expose RPC endpoints.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_login(p_email text, p_password text)
returns table (
  id uuid,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select au.id, au.full_name, au.email
  from public.admin_users au
  where au.email = p_email
    and au.password_hash = extensions.crypt(p_password, au.password_hash)
  limit 1;
end;
$$;

create or replace function public.admin_change_password(p_id uuid, p_current_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  select (password_hash = extensions.crypt(p_current_password, password_hash))
  into ok
  from public.admin_users
  where id = p_id;

  if ok is distinct from true then
    return false;
  end if;

  update public.admin_users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = p_id;

  return true;
end;
$$;

-- Browser uses anon/publishable key, so RPC must be executable by anon.
grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_change_password(uuid, text, text) to anon, authenticated;

-- Ask PostgREST to reload schema cache so /rpc/admin_login exists (prevents 404).
select pg_notify('pgrst', 'reload schema');

