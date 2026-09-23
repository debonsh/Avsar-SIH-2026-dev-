-- Avsar mirror tables. These five are the rows the app writes on every score,
-- application, quest and coach reply (src/lib/backend.js). Run this once, and
-- again any time the schema drifts (for example: an older assessments table
-- without the `found` column, which makes a public passport unable to prove
-- anything).
--
-- Safe to re-run AND non-destructive: tables are created if missing, columns are
-- added if missing, policies are dropped and recreated. No row is ever deleted
-- by this file.
--
-- Pure DDL: no `do $$ … $$`, no plpgsql — some SQL editors split a script on
-- every semicolon, which tears dollar-quoted bodies apart.
--
-- Prototype-open anon policies, exactly like jobs_board and friends. The locked
-- tables are profiles/user_roles (see supabase-auth-only.sql).

create table if not exists public.assessments(
  id uuid primary key default gen_random_uuid(),
  student text not null,
  ats int check (ats between 0 and 95),
  main int check (main between 0 and 100),
  role_key text,
  found jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.job_events(
  id uuid primary key default gen_random_uuid(),
  student text not null,
  job_id text not null,
  event text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_sections(
  id uuid primary key default gen_random_uuid(),
  student text not null,
  section text not null,
  payload jsonb not null default '{}'::jsonb,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_artifacts(
  id uuid primary key default gen_random_uuid(),
  student text not null,
  job_id text,
  kind text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback(
  id uuid primary key default gen_random_uuid(),
  student text not null,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- catch-up for tables created by an earlier schema: the app has been sending
-- these columns, and without them the write 404s and falls back to localStorage.
alter table public.assessments add column if not exists found jsonb not null default '[]'::jsonb;
alter table public.assessments add column if not exists gaps jsonb not null default '[]'::jsonb;
alter table public.job_events add column if not exists created_at timestamptz not null default now();
alter table public.resume_sections add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.resume_sections add column if not exists status text;
alter table public.ai_artifacts add column if not exists job_id text;
alter table public.feedback add column if not exists comment text;

alter table public.assessments enable row level security;
alter table public.job_events enable row level security;
alter table public.resume_sections enable row level security;
alter table public.ai_artifacts enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "open all" on public.assessments;
drop policy if exists "open all" on public.job_events;
drop policy if exists "open all" on public.resume_sections;
drop policy if exists "open all" on public.ai_artifacts;
drop policy if exists "open all" on public.feedback;

create policy "open all" on public.assessments for anon using (true) with check (true);
create policy "open all" on public.job_events for anon using (true) with check (true);
create policy "open all" on public.resume_sections for anon using (true) with check (true);
create policy "open all" on public.ai_artifacts for anon using (true) with check (true);
create policy "open all" on public.feedback for anon using (true) with check (true);

notify pgrst, 'reload schema';
