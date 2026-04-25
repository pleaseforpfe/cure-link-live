-- Simple admin users for `/login`
-- Note: store passwords as hashes (never plaintext).

create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  role text not null default 'admin',
  email text not null,
  password_hash text not null,

  constraint admin_users_email_unique unique (email),
  constraint admin_users_role_admin check (role = 'admin')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

