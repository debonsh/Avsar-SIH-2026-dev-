-- C2C Sept-30 portal — run once in the Supabase dashboard SQL editor.
-- App works fully offline on seeds when these are missing; every read is try-remote → catch-seeds.

create table public.jobs_board(id uuid primary key default gen_random_uuid(), title text not null, company text not null, location text not null, type text not null, role_key text not null, required_skills jsonb default '[]'::jsonb, min_score int default 40, apply_url text, description text, created_by text, created_at timestamptz default now());
create table public.fdp_board(id uuid primary key default gen_random_uuid(), title text not null, org text not null, kind text not null check (kind in ('fdp','faculty-internship','consultancy','workshop','research')), location text, url text, deadline date, created_at timestamptz default now());
create table public.applications(id uuid primary key default gen_random_uuid(), job_id text not null, student text not null, ats int, main int, created_at timestamptz default now());
create table public.interests(id uuid primary key default gen_random_uuid(), fdp_id text not null, faculty text not null, created_at timestamptz default now());
create table public.kudos(id uuid primary key default gen_random_uuid(), c2c_id text not null, created_at timestamptz default now());
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
