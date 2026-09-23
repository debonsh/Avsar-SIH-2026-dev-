-- Avsar auth tables. Paste this whole file into the Supabase dashboard →
-- SQL editor, project ifyxvvddnrcubkzwfpvg (the one in "avsar SIH 2026/.env"),
-- and Run.
--
-- Safe to re-run AND non-destructive: tables are created if missing, policies
-- are dropped and recreated. Signed-in identity rows are never deleted.
--
-- Pure DDL on purpose: no `do $$ … $$` blocks, no plpgsql, no dollar-quoting.
-- Some SQL editors split a script on every semicolon, which tears a
-- dollar-quoted body apart ("syntax error at or near if").

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  track text check (track in ('ayush','tech')),
  role text not null default 'student' check (role in ('student','industry','faculty','institute','ayush')),
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','industry','faculty','institute','ayush')),
  track text check (track in ('ayush','tech')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "own roles read" on public.user_roles;
drop policy if exists "self claim student" on public.user_roles;

-- profiles: owner-only, all verbs. A signed-in user can only ever touch their
-- own row; guests (anon) get nothing.
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_roles: a user reads their own roles and may self-claim only "student".
-- Every desk role (industry / faculty / institute / ayush) is issued by an admin
-- holding the service key — never from the browser.
create policy "own roles read" on public.user_roles for select using (auth.uid() = user_id);
create policy "self claim student" on public.user_roles for insert with check (auth.uid() = user_id and role = 'student');

-- make PostgREST pick the new tables up immediately instead of waiting for its cache
notify pgrst, 'reload schema';
