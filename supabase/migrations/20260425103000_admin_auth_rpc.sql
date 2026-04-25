-- RPC helpers for admin login + password change against `public.admin_users`
-- Requires `pgcrypto` for `crypt()` + `gen_salt()`.

create extension if not exists pgcrypto;

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
    and au.password_hash = crypt(p_password, au.password_hash)
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
  select (password_hash = crypt(p_current_password, password_hash))
  into ok
  from public.admin_users
  where id = p_id;

  if ok is distinct from true then
    return false;
  end if;

  update public.admin_users
  set password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  where id = p_id;

  return true;
end;
$$;

grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_change_password(uuid, text, text) to anon, authenticated;
