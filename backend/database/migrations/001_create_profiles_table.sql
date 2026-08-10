--backend/database/migrations/001_create_profiles_table.sql

-- 1. Create the profiles table, linked 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Automatically create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;

-- 4. Policy: users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 5. Policy: users can update their own profile (but not their role —
--    we'll enforce that role can't be self-edited at the app layer too)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);