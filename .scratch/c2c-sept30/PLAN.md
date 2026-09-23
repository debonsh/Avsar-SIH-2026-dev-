# C2C Sept-30 Build Plan — Academia-Industry Portal (student-first)

**Deadline:** 30 Sept 2026. **Current:** ~35% (student-only, localStorage, static jobs).
**Goal:** 100% brief coverage on surface (student-first login, hidden partner portals, posting works, quiz + portfolio + dashboards demoable), offline-safe, `npm run build` green.
**Vision (notebook 11-Sep):** not just internship search — upskill interactively + **showcase skills to the world, in a cool way**. Gamified + sociable.
**Stack:** Vite + React + Tailwind v4 + Supabase + Gemini Flash (optional). No new deps.

## 0. Locked decisions (do not re-debate)

- Student-first login. Industry/faculty/institute portals hidden behind subtle footer link (`lib/roles.js` persists `c2c-role`). No prominent role tabs.
- Single `app/src/App.jsx` shell + view router only, no logic bloat. New views = new components under `app/src/components/`.
- Supabase = persistence, seeds = fallback. Every remote read does `try remote → catch seeds`. Demo never blanks.
- No real auth. Stable **C2C ID** (`C2C-XXXXXX`, generated once, `c2c-id`) is the login stand-in — shown on portfolio, stamped on applications. Real Auth is post-Sept.
- Scoring stays transparent: ATS 0-95 (`lib/score.js`) + Quiz 0-100 + Quest bonus → MAIN 0-100. Same formula tech/non-tech as MASTER_PRD §4.1.
- Verification = 2 tiers only: `verified` (quest pair done / GitHub linked / cert URL) vs `claimed` (self-typed). No blockchain, no hashing.
- AI bot grounds every answer in live user state (score, gaps, MAIN). Gemini when key present, canned local answers otherwise. Never a generic chatbot.
- Sociable-lite only: public portfolio link + nickname on battle board + kudos button. No feed, no comments, no DMs (moderation + backend = post-Sept).

## 0b. Architecture verdicts (decided 12-Sep, do not re-debate)

- **No MERN.** Supabase (Postgres + Auth + Storage + Edge Functions) already IS the backend. Rebuilding Express+Mongo from zero buys judges nothing and burns a week. Stack stays Vite + Supabase.
- **No live scrapers before Sept 30.** Naukri/LinkedIn ban scraping, selectors break on stage, and a scraper needs a server + cron + dedupe + legal cover. Jobs arrive via Slice B posting + curated seeds. The seam is already built: any future source (scraper, Firecrawl, API) just maps through `toJobShape()` in `lib/store.js` — one function, zero feed changes.
- **No RAG before Sept 30.** Chatbot + routine builder share ONE key (`VITE_GEMINI_KEY`, free at aistudio.google.com/app/apikey → `app/.env`). Grounding = live user state injected into the prompt (score, gaps, role) + local deterministic roadmap (`roadmapGenerator.js`). Real RAG (pgvector over course docs) is post-Sept; Supabase supports pgvector so no stack change needed.
- **Resume ← evaluation flow:** quiz (Slice C) + verified quest pairs feed MAIN → MAIN gates `matchJobs` eligibility → apply stamps C2C ID. No separate "assign data to resume" step; the score IS the assignment.
- **Quest uniqueness:** evaluation gets uniqueness (Slice C banks 20 Qs/role, samples 10 seeded by `hashStr(C2C ID + day)` via `pickForId`); learning quests stay curated (same homework for all is fine). `lib/quests.js` owns `hashStr/pickForId/isEvidenceUrl`, all under `node --test`.
- **Quest completion checking (3 tiers, built):** course tick = claimed (self-report); project tick requires proof URL (`getEvidence/setEvidence` in `lib/progress.js`, validated by `isEvidenceUrl`); only course + project + valid evidence counts in `completedSkillIdsForRole()` → lifts ATS. UI: project checkbox asks for link first; `+score` badge and skill highlight render only when verified.

## Notebook coverage (11-Sep — every item must land somewhere)

| Notebook item | Status | Where |
|---|---|---|
| Profile Analyze | ✅ done | `lib/score.js` ATS breakdown |
| Suggest skill | ✅ done | missing + `coursesFor()` |
| Match internship & job | ✅ done + Slice B | `matchJobs()` + industry posting |
| Job search | ✅ done | jobs search/filter/shelves |
| Career path recommend | ✅ done | `rankRoles()` best-fit |
| Mock interview | ✅ done | interview view + streak |
| Scoring system | ✅ done + Slice C | ATS + quiz → MAIN |
| Leaderboard | ✅ done + Slice I | battle + nickname row |
| AI-Help bot | 🆕 Slice H | floating drawer, grounded in live state |
| Skill showcase / cool way | 🆕 Slice F | portfolio + C2C ID + share link |
| Online certi | 🆕 Slice F | cert log (issuer + URL), verified tick |
| Login / Unique ID | 🆕 Slice I | `lib/identity.js`, no real auth |
| Sociable | 🆕 Slice I (lite) | public link + kudos, no feed |

## 1. File map (what goes where)

```
app/src/
  App.jsx                 ← add role switcher + view router only, no logic bloat
  lib/roles.js            ← NEW: ROLES list, demo accounts, useRole() hook (localStorage)
  lib/scores.js           ← NEW: combineScores(ats, quiz, questCount, role) → MAIN + rank (extract from score.js, keep old exports)
  data/quiz.js            ← NEW: 10 MCQ per role (sde, data, marketing, govt) + gradeQuiz()
  data/fdps.js            ← NEW: seed FDPs / faculty internships / consultancy / workshops
  data/seedJobsExtra.js   ← NEW: 20 extra jobs to reach 30+ total (merge with jobs.js JOBS at runtime)
  lib/store.js            ← NEW: 1 Supabase wrapper (jobs, fdps, applications, interests, kudos) with seed fallback
  lib/identity.js         ← NEW: getOrCreateC2CId() stable unique ID + nickname (Slice I)
  components/
    RoleSwitch.jsx        ← NEW: 4-role segmented tabs + demo account label
    IndustryPost.jsx      ← NEW: post job/internship form + my-postings list + applicants count
    QuizView.jsx          ← NEW: quiz runner + score + retry
    FacultyView.jsx       ← NEW: FDP / faculty-internship / consultancy / workshop boards + interest button
    InstituteView.jsx     ← NEW: dashboard (CSS bars only, no chart lib) + student table + export CSV
    PortfolioView.jsx     ← NEW: shareable profile + cert log + C2C ID + verified ticks + print-to-PDF + kudos
    AICoach.jsx           ← NEW: floating AI help-bot drawer, grounded in live state (Slice H)
    JobsView.jsx          ← EXTRACT from App.jsx jobs block (props only, no behavior change)
```

Supabase tables (run once in dashboard SQL editor):
```sql
create table public.jobs_board(id uuid primary key default gen_random_uuid(), title text not null, company text not null, location text not null, type text not null, role_key text not null, required_skills jsonb default '[]'::jsonb, min_score int default 40, apply_url text, description text, created_by text, created_at timestamptz default now());
create table public.fdp_board(id uuid primary key default gen_random_uuid(), title text not null, org text not null, kind text not null check (kind in ('fdp','faculty-internship','consultancy','workshop','research')), location text, url text, deadline date, created_at timestamptz default now());
create table public.applications(id uuid primary key default gen_random_uuid(), job_id text not null, student text not null, ats int, main int, created_at timestamptz default now());
create table public.interests(id uuid primary key default gen_random_uuid(), fdp_id text not null, faculty text not null, created_at timestamptz default now());
create table public.kudos(id uuid primary key default gen_random_uuid(), c2c_id text not null, created_at timestamptz default now());
alter table jobs_board enable row level security; alter table fdp_board enable row level security;
alter table applications enable row level security; alter table interests enable row level security;
create policy "open all" on jobs_board for anon using (true) with check (true);
create policy "open all" on fdp_board for anon using (true) with check (true);
create policy "open all" on applications for anon using (true) with check (true);
create policy "open all" on interests for anon using (true) with check (true);
create policy "open all" on kudos for anon using (true) with check (true);
```

## 2. Build order (do in this order, each slice demoable)

### Slice A — Role shell (0.5 day) ✅ DONE (hidden, student-first)
- `lib/roles.js` done: `APP_ROLES`, `loadRole()/saveRole()` on `c2c-role`.
- Portals hidden: no header tabs — subtle footer link (`recruiters · faculty · institutes`) switches role, stub card per portal with back button. Student views gated on `appRole === "student"`.
- `RoleSwitch.jsx` kept on disk unused (reuse or delete in Slice G).

### Slice B — Industry posting (2 days) ✅ DONE light (tests 18/18, build green)
- `lib/store.js` + `lib/identity.js` (C2C ID early — applications needed the key) + `data/seedJobsExtra.js` (20 jobs, ids 100+) + `components/IndustryPost.jsx` + `tests/store.test.js` (TDD red→green).
- Bonus fix: extensionless `../data/colleges` import in `supabase.js` broke `node --test` — now `.js`, all runners green.
- Feed = `mergeJobs(custom local-first, remote board, EXTRA, JOBS, live)`; still gated on ATS until Slice C switches to MAIN. Apply stamps `c2c-applications` + best-effort `applications` row with C2C ID.
- **Live data (no scrapers):** `listLiveJobs()` pulls free Remotive API (no key), 6h `localStorage` cache, 8s abort, seeds survive offline. `guessRole()` drops unmappable rows (wrong track > missing row); `extractSkills()` intersects title+desc with role vocab (+ github→git). Refresh button refetches board + live; `· live feed Xm ago` label; `• live` tag on cards. Covered in `tests/recommend.test.js`.
- **Demand-ordered recommendations:** `orderMissingByDemand()` sorts gaps by open-job frequency; roadmap weeks lead with highest-demand skill ("asked in N open roles") and reuse quest project text; Fix-gaps top-3 + AI prompt context use the same ordering.
- Create `lib/store.js`: `listJobsBoard(), createJobBoard(payload), listApplications(), applyToJob(jobId, student, ats, main)` — all `try supabase → catch null`, callers fall back to local `JOBS`.
- Create `components/IndustryPost.jsx`: form (title, company, location, type [Internship/Full-time/Govt], role_key, skills comma-input, min_score, apply_url, description) + validation (title/company/skills required) + my-postings (filter `created_by == demo-industry`) + applicant count via `applications`.
- Student JobsView: `allJobs = [...remoteBoard mapped to JOBS shape, ...JOBS, ...seedJobsExtra]`, dedupe by id. `matchJobs(role, mainScore, found, allJobs)` — switch gating from `score` (ATS) to `mainScore`.
- Apply button: writes `applications` row (best-effort) + existing localStorage `c2c-applied` + external link. Never blocks on network.
- Done when: post as industry → appears in student feed in <5s (or after refresh offline), apply increments count, build green.

### Slice C — Quiz = the word "questionnaire" (1.5 days) ✅ DONE (tests 30/30, build green)
- `data/quiz.js` (20 factual Qs × 4 roles, gradeQuiz/gradeSet, quizSample 10/role seeded by C2C ID + day) + `components/QuizView.jsx` (1-Q-at-a-time, progress, review, retry, `c2c-quiz-{role}` best) + `lib/scores.js` (`combineScores` over `calculateMainScore`/`rankFor`, pairs → `min(100,pairs*20)`). Jobs gated on MAIN, Score view shows `MAIN • rank (ATS + Quiz + quests)`, apply stamps ATS + MAIN.
- Create `data/quiz.js`: `QUIZ = { sde: [{q, opts[4], ans}], data: [...], ... }` 10 each, `gradeQuiz(role, picks) → {score 0-100, correct, total}`. Keep questions factual, 1-line, no images.
- Create `components/QuizView.jsx`: role inherits global `role`, 1 question at a time, progress bar, submit → score + per-question review + retry. Persist best per role `c2c-quiz-{role}`.
- Create `lib/scores.js`: `combineScores(ats, quiz, questPairs, roleKey)` → `{ main, rank }` using PRD weights (tech 0.5/0.3/0.2, non-tech 0.6/0.3/0.1). Quest pairs → proof proxy: `min(100, pairs*20)`. Show MAIN line in Score view + gate jobs on MAIN.
- Done when: quiz runs offline, best score persists, MAIN rises when quiz/quests improve, old `calculateMainScore` still passes tests.

### Slice D — Faculty view (1.5 days) ✅ DONE (tests 33/33, build green)
- `data/fdps.js` (12 seeds × 4 kinds) + `components/FacultyView.jsx` (JobsView-lite: kind tabs + search + Express interest + Interested shelf, shared Card/Badge/Segmented) + `store.js` interests (`loadInterests`/`toggleInterest`/`recordInterest` → `c2c-interests` + `interests` table best-effort). Faculty portal renders board; institute stub kept for Slice E.
- Root fix: `isSupabaseOn()` crashed under `node --test` (`import.meta.env` undefined) — optional-chained, all remote fns now null-safe in node.
- Create `data/fdps.js`: 12 seeds across 4 kinds (fdp, faculty-internship, consultancy, workshop/research) with org, location, url, deadline.
- Create `components/FacultyView.jsx`: kind filter tabs + cards + search + "Express interest" (localStorage `c2c-interests` + `interests` table best-effort) + Interested shelf. Mirror JobsView patterns, do not invent new UI.
- Done when: 4 kinds browsable, interest persists, industry-posted workshops (optional `fdp_board` insert in IndustryPost v2 — cut if time) appear, build green.

### Slice E — Institution dashboard (2 days) ✅ DONE (tests 37/37, build green)
- `lib/cohort.js` (24-student demo cohort 6/role + `mainOf`/`enrich` reusing `combineScores`/`rankFor` + `cohortStats` + `toCSV`) + `components/InstituteView.jsx` (stat cards, avg-MAIN-by-track bars, funnel, top-5 gaps, cohort table with live "you" row, Blob CSV export — `Meter`/CSS only, no chart lib). Live row appends only with real signal (ats/quiz > 0); numbers recompute from App state automatically.
- Create `components/InstituteView.jsx`: inputs = demo cohort (seed 24 students: name, role, ats, quiz, quests) + live user row appended. Outputs: avg MAIN by role (CSS bars via `Meter`), % Gold+ (MAIN≥65), top-5 gaps histogram, placement funnel (scored → quiz → Gold → applied), table + Export CSV (Blob download, no dep).
- No chart lib. Reuse `Card, Badge, Progress, Meter`.
- Done when: numbers recompute when user saves score, CSV downloads, works offline on seeds.

### Slice F — Portfolio = showcase in a cool way (2 days) ✅ DONE (tests 42/42, build green)
- `components/PortfolioView.jsx` (C2C ID badge, MAIN + rank band, found/missing with verified ticks, verified quest projects with proof links, GitHub link row, cert log add-form with URL ticks, journey timeline, copy-showcase-link with clipboard fallback, print via `window.print()` + `print:hidden` on interactive rows, kudos count). Certs/GitHub live in `lib/identity.js` (`c2c-certs`/`c2c-github`); `isVerified` + kudos (`fetchKudos`/`giveKudos` once-only + local fallback) + `loadSharedShowcase` (best MAIN + apps + kudos from remote, null → honest empty state) in `lib/store.js`. `?c2c=` link lands on portfolio in read-only mode via view initializer; empty state routes to Score/Quiz/Quests.
- Create `components/PortfolioView.jsx`: reads resume `text`, `result`, quiz best, quest pairs, GitHub handle (`c2c-github`), **cert log** (`c2c-certs`: [{issuer, title, url}] add-form, URL present = verified tick). Renders: header with **C2C ID badge** (from `lib/identity.js`), MAIN + rank badge, skills found/missing with verified tick (quest-done or GitHub-linked = verified, else claimed), projects, certs, timeline (score → quiz → quests → applied). Buttons: Print/Save PDF (`window.print()`), **Copy showcase link** (`location.origin + location.pathname + '?c2c=<id>'`), **kudos count** (Supabase `kudos` best-effort + local fallback).
- Public read-only mode: on load, if `?c2c=` param present and differs from mine, render portfolio from that ID's best-effort remote row, else "profile not found on this device" empty state (local-first honesty, no fake data).
- Add nav entry `portfolio` for student role only.
- Done when: empty state guides to Score/Quiz/Quests, full state prints cleanly on 1-2 pages, share link copies, no network needed.

### Slice H — AI Help Bot drawer (1.5 days, notebook: "AI-Help bot") ✅ DONE (tests 47/47, build green)
- `lib/coach.js` (`COACH_ACTIONS` 4-pack + `buildPrompt` embedding role/score/missing/best-fit + `localAnswer` canned offline answers reusing `coursesFor`) + `askCoach()` in `lib/gemini.js` (same key/fallback pipeline, AI upgrades never gates) + `components/AICoach.jsx` (floating Sparkles button bottom-right on every student view → non-modal drawer, no backdrop so nav stays live; quick chips + free-text input; offline answers tagged with key upsell). Drawer props reuse the Fix-gaps ordering (`orderMissingByDemand`).
- Create `components/AICoach.jsx`: floating Sparkles button (bottom-right, all student views) → drawer with quick actions: "Explain my gaps", "Improve my bullets", "Interview tip for my role", "What career fits me?". Each action builds a prompt from **live state** (role label, score, missing[0..3], bestFit) and calls existing `improveResume()` / `mockInterviewFeedback()` in `lib/gemini.js` (+ 1 new `askCoach(prompt)` export reusing same key/fallback pattern). Free-text input allowed, same pipeline.
- Local fallback (no key): canned answers computed from state — e.g. gaps list + top `coursesFor()` link, STAR template with user's role. Drawer must be useful offline; "add key for AI" is the upsell, not the gate.
- Done when: 4 quick actions answer in <2s offline, AI answer streams in when key present, drawer never blocks navigation, build green.

### Slice I — Login/Unique ID + sociable-lite (1 day, notebook: "Login/Unique ID", "Sociable") ✅ DONE (folded into F + G)
- `lib/identity.js`: `getOrCreateC2CId()` + `loadNickname()/saveNickname()` (trims + 24-char cap). C2C ID stamped on portfolio header, `applications` + `kudos` writes (Slices B/F). Nickname editor on portfolio ("Anonymous Coder" default, `print:hidden`); battle board "You" badge shows nickname when set — resume never leaves the device. `?c2c=` link opens read-only showcase (Slice F).
- Create `lib/identity.js`: `getOrCreateC2CId()` → `C2C-XXXXXX` (6 chars, unambiguous alphabet, stored `c2c-id`, created once) + `loadNickname()/saveNickname()` (`c2c-nick`, editable in portfolio, defaults "Anonymous Coder").
- Stamp C2C ID on: portfolio header, battle board "You" row label, `applications` + `kudos` writes.
- Battle board: opt-in nickname shown next to college average (no resume data leaves device — only nickname + score, same privacy rule as colleges).
- Sociable-lite = public `?c2c=` portfolio link + nickname leaderboard + kudos button. No feed/comments/DMs.
- Done when: ID stable across refresh, portfolio shows ID + nickname editor, shared link opens read-only view, kudos increments, build green.

### Slice G — Landing + hardening + submission (2 days) ✅ DONE (tests 48/48, build green)
- `Landing.jsx` hero rewritten: H1 "Upskill interactively. Showcase to the world." + pitch line "Not just finding internships — …", funnel Analyze → Upskill → Showcase → Match, live counters (sample ATS / sample MAIN via `combineScores` / jobs unlocked at MAIN / 100% free). Header subtitle → "Academia–Industry Collaboration Portal" (Campus2Corporate mark kept).
- Hardening: empty states verified on every view (jobs filter, battle CTA, portfolio guide, faculty shelf, institute hint, score sample); mobile nav maps NAV so quiz/portfolio/coach ship on small screens; `supabase.sql` exported at repo root (all 6 tables + open policies).
- Root fix: `saveNickname` trims (was slice-only).
- Human tasks left: PPT (problem, 4 users, live flow, tech, what's stubbed §4, pilot plan), 2-min demo video (script §5), run `supabase.sql` once in dashboard.
- Rewrite `Landing.jsx` hero: student-first funnel (Analyze → Upskill → Showcase → Match), notebook pitch line "not just finding internships — upskill interactively, showcase to the world". Counters computed live (sample ATS, jobs unlocked, free links). Partner portals mentioned in one footer line only.
- Rename header subtitle to "Academia–Industry Collaboration Portal" (keep Campus2Corporate mark for continuity).
- Full pass: empty states everywhere, mobile nav includes new views, `npm run build` + offline test (kill wifi, quiz→score→jobs→portfolio still works).
- Submission pack: PPT (problem, 4 users, live flow, tech, what's stubbed, pilot plan), 2-min demo video, SQL file export.

## 3. Acceptance checklist (must all be true on Sept 29)

- [x] 4 roles switchable, persist on refresh
- [x] Industry post appears in student feed (remote or after refresh)
- [x] Quiz runs offline, best persists, MAIN moves jobs gating
- [x] Faculty: 4 kinds + interest persists
- [x] Institute: 4 charts + table + CSV export, includes my live score
- [x] Portfolio prints to PDF, verified vs claimed ticks visible, cert log + C2C ID + share link + kudos work
- [x] AI bot drawer answers all 4 quick actions offline; AI upgrades with key
- [x] C2C ID stable, nickname on battle board, `?c2c=` link opens read-only view
- [x] 30+ jobs, 12+ FDPs seeded
- [x] `npm run build` green, offline demo unbroken, no console-blocking errors

## 4. Explicitly NOT building (say so in PPT)

Real auth, RLS per-user, resume builder, social feed/comments/DMs, payments, Firecrawl scraping, AI auto-grading of voice, email alerts. Alert button stays local (`c2c-alert`). Voice stays 15s + local fallback. C2C ID is the login stand-in — say so openly in PPT.

## 5. Demo script (2 min, memorize)

1. Student: paste resume → ATS + gaps (15s). 2. Quiz 3 Qs → MAIN rises (15s). 3. Quests tick 1 pair → MAIN rises again (10s). 4. Bot: "explain my gaps" → grounded answer (10s). 5. Jobs: locked → eligible, apply (15s). 6. Portfolio: C2C ID + verified ticks, copy showcase link, print (15s). 7. Footer → industry: post internship, show applicant (15s). 8. Footer → faculty FDP interest + institute CSV (15s). Close: "Upskill interactively, showcase to the world — only numbers compete."

## 6. Risks + fallbacks

- Supabase down/keys missing → seeds render, writes queue in localStorage, banner "Local mode". Never throw.
- Time overrun → cut order: kudos first, then workshops-posting, then CSV export, then print CSS. Never cut C2C ID, posting, quiz, portfolio, bot drawer.
- ATS gaming question → answer: "ATS is density signal, MAIN gates on quiz + quest proof, GitHub link required for Gold+."
