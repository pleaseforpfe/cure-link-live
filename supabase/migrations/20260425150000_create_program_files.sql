-- Program PDF (for `/program` + homepage "Download program" button)

create extension if not exists "pgcrypto";

create table if not exists public.program_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null default 'Program',
  file_url text not null,
  is_active boolean not null default true
);

-- only one active program file at a time
create unique index if not exists program_files_only_one_active
on public.program_files (is_active)
where is_active;

-- keep updated_at fresh
drop trigger if exists set_program_files_updated_at on public.program_files;
create trigger set_program_files_updated_at
before update on public.program_files
for each row
execute function public.set_updated_at();

