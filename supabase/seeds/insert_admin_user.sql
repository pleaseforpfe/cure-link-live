-- Seed a first admin user (for later use).
-- IMPORTANT: This stores a bcrypt hash using pgcrypto's `crypt`.
-- If your project has no RLS yet, treat this as DEV-ONLY.

create extension if not exists pgcrypto;

insert into public.admin_users (full_name, email, password_hash)
values (
  'Admin User',
  'admin@curelink.live',
  crypt('ChangeMe123!', gen_salt('bf'))
)
on conflict (email) do nothing;
