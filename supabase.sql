-- Avsar portal — run once in the Supabase dashboard SQL editor.
-- App works fully offline on seeds when these are missing; every read is try-remote → catch-seeds.

create table public.jobs_board(id uuid primary key default gen_random_uuid(), title text not null, company text not null, location text not null, type text not null, role_key text not null, required_skills jsonb default '[]'::jsonb, min_score int default 40, apply_url text, description text, created_by text, created_at timestamptz default now());
create table public.fdp_board(id uuid primary key default gen_random_uuid(), title text not null, org text not null, kind text not null check (kind in ('fdp','faculty-internship','consultancy','workshop','research')), location text, url text, deadline date, created_at timestamptz default now());
create table public.applications(id uuid primary key default gen_random_uuid(), job_id text not null, student text not null, ats int, main int, created_at timestamptz default now());
create table public.interests(id uuid primary key default gen_random_uuid(), fdp_id text not null, faculty text not null, created_at timestamptz default now());
create table public.kudos(id uuid primary key default gen_random_uuid(), device_id text not null, created_at timestamptz default now());
create table public.college_scores(id uuid primary key default gen_random_uuid(), college_name text not null, score int check(score between 0 and 100), created_at timestamptz default now());

alter table jobs_board enable row level security;
alter table fdp_board enable row level security;
alter table applications enable row level security;
alter table interests enable row level security;
alter table kudos enable row level security;
alter table college_scores enable row level security;

create policy "open all" on jobs_board for anon using (true) with check (true);
create policy "open all" on fdp_board for anon using (true) with check (true);
create policy "open all" on applications for anon using (true) with check (true);
create policy "open all" on interests for anon using (true) with check (true);
create policy "open all" on kudos for anon using (true) with check (true);
create policy "open read/insert" on college_scores for anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- One-off rename for databases created before the Avsar naming: the app reads
-- and writes kudos.device_id now. Run this single line on its own against an
-- existing install (it errors harmlessly with "column does not exist" once the
-- rename is done, or on a fresh install that already created device_id):
--
--   alter table public.kudos rename column c2c_id to device_id;
--
-- It is deliberately not part of this script: a conditional version needs a
-- `do $$ … $$` block, and some SQL editors split a script on every semicolon,
-- which tears dollar-quoted bodies apart.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Signed-in portal identity (Google OAuth). Optional: the app is fully usable
-- as a guest keyed by the anonymous device id, and only mirrors these rows when
-- a user is signed in (lib/backend.js saveProfileRemote → profiles).
--
--   profiles     one row per auth user: which portal (track) and which role.
--   user_roles   the authorization ledger behind lib/rbac.js — a role change is
--                a row here, not a client-side string, once an admin issues it.
--
-- Both tables are locked to their owner: a signed-in user may only read and
-- write rows where auth.uid() = user_id. Guests (anon) get nothing.
-- ---------------------------------------------------------------------------

create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  track text check (track in ('ayush','tech')),
  role text not null default 'student' check (role in ('student','industry','faculty','institute','ayush')),
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.user_roles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','industry','faculty','institute','ayush')),
  track text check (track in ('ayush','tech')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table profiles enable row level security;
alter table user_roles enable row level security;

-- profiles: owner-only, all four verbs through one policy each.
create policy "own profile read" on profiles for select using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_roles: a user may read their own roles and self-claim the student role on
-- signup. Anything else (faculty, institute, industry, ayush) must be granted by
-- an admin holding the service role key — never from the browser.
create policy "own roles read" on user_roles for select using (auth.uid() = user_id);
create policy "self claim student" on user_roles for insert with check (auth.uid() = user_id and role = 'student');

-- profiles.updated_at is written by the client on every upsert
-- (lib/backend.js saveProfileRemote) — the same clock the device/cloud
-- reconcile compares — so no trigger is needed. Staying dollar-quote free
-- also keeps this file runnable in any SQL editor.

-- ---------------------------------------------------------------------------
-- Mirror tables. The app writes these on every score, application, quest and
-- coach reply (src/lib/backend.js); without them those writes 404 and fall back
-- to localStorage only — every screen still works, but nothing syncs.
-- Same prototype-open anon policies as jobs_board above. If you are adding
-- these to a database that already has the earlier tables, paste the matching
-- file instead: .scratch/supabase-mirror-tables.sql (re-running this script
-- aborts on the existing creates before it reaches here).
-- ---------------------------------------------------------------------------

create table public.assessments(id uuid primary key default gen_random_uuid(), student text not null, ats int check (ats between 0 and 95), main int check (main between 0 and 100), role_key text, found jsonb not null default '[]'::jsonb, gaps jsonb not null default '[]'::jsonb, created_at timestamptz not null default now());
create table public.job_events(id uuid primary key default gen_random_uuid(), student text not null, job_id text not null, event text not null, created_at timestamptz not null default now());
create table public.resume_sections(id uuid primary key default gen_random_uuid(), student text not null, section text not null, payload jsonb not null default '{}'::jsonb, status text, created_at timestamptz not null default now());
create table public.ai_artifacts(id uuid primary key default gen_random_uuid(), student text not null, job_id text, kind text not null, body text not null, created_at timestamptz not null default now());
create table public.feedback(id uuid primary key default gen_random_uuid(), student text not null, rating int check (rating between 1 and 5), comment text, created_at timestamptz not null default now());

alter table assessments enable row level security;
alter table job_events enable row level security;
alter table resume_sections enable row level security;
alter table ai_artifacts enable row level security;
alter table feedback enable row level security;

create policy "open all" on assessments for anon using (true) with check (true);
create policy "open all" on job_events for anon using (true) with check (true);
create policy "open all" on resume_sections for anon using (true) with check (true);
create policy "open all" on ai_artifacts for anon using (true) with check (true);
create policy "open all" on feedback for anon using (true) with check (true);
