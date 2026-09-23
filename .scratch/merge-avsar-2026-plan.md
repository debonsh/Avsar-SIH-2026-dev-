# Avsar 2026 Merge Plan (fixed 2026-09-23)

Canonical repo: `avsar SIH 2026/` ONLY. `old backup/Hackathon Practice/app/` is read-only reference, never edited, never imported wholesale.

## Principles (no mix-match)
- Clean copy: port missing logic file-by-file into avsar, adapt imports/naming to avsar conventions, keep pure functions + tests intact.
- Logic intact: every ported lib keeps its tested pure API; add tests before wiring into UI.
- Onboarding-routed portals (microservice-like): one Vite build, one Vercel project. `Welcome` page at `/` asks portal + role + job/lane. Choice sets `track` + `role` and routes to that portal's engine. After that both portals act isolated: separate theme, nav, seeds, scoring, questionnaire.
- Feature parity direction: old `app` is behind. Add its missing pieces INTO avsar, not the reverse.

## Track / role model
- `track`: `ayush` (BAMS, white ayurvedic) | `tech` (BTech/C2C, discord-dark blurple like old app).
- `role` union (5): `student, industry, faculty, institute, ayush`.
- Keys: `c2c-track`, `c2c-role` in localStorage. `track=null` = not onboarded -> force `/`.
- Store: `C2CProvider` in `avsar SIH 2026/src/app/store.jsx` owns `track, role, resume, events, user`.

## Single entry
- New `src/pages/Welcome.jsx` at `/`: Avsar 2026 chooser, two cards (Vaidya / Tech). Click -> `/profile` onboarding with portal preselected.
- Existing `/ayush` and `/home` become portal dashboards, not entries.

## Theme split (one Shell, conditional)
- `track==ayush`: `ayush-light`, `bg-[#f6f3ea]`, emerald, Bricolage + Inter + Devanagari (current shell).
- `track==tech`: `bg-ink text-zinc-300`, blurple `#5865F2`, dark header/footer from old `app/src/app/shell.jsx`, square panels.
- New `src/lib/track.js`: `loadTrack/saveTrack`. Shell root reads `track`, sets `data-track` + classes. No second shell component.

## Feature ports (old -> avsar, clean copies)
1. `old/src/lib/dopamine.js, analytics.js, scores.js` -> audit, port only live logic into avsar `lib/` with avsar storage keys, add `tests/*.test.js`.
2. `old/src/data/questionnaire.js` COMMON + sde/data/marketing/govt banks -> merge into avsar `src/data/questionnaire.js` (currently ayush-only).
3. `old/src/lib/profile.js` tech PROFILE_QS/track queries -> make avsar `profile.js` track-aware (ayush keeps year/lane/college, tech keeps track/skills/goal/loc/hours).
4. Old dark shell/nav patterns -> Tech theme variant only, not full shell copy.

## Order (your sleep roadmap)
1. Welcome + onboarding (portal/role/job) + track store + dual theme.
2. Bugfix questionnaire + resume (track-aware banks, Resume.jsx target-track selector, stale-shape normalize).
3. RBAC `RequireRole` guards per route.
4. Supabase Auth (Google OAuth in `lib/auth.js` already) + user_roles/profiles + RLS (you paste keys, you run SQL).
5. `node --test tests/*.test.js`, `npm run build`, `npm run lint` in avsar.
6. You deploy (single Vercel project, root `avsar SIH 2026`, vercel.json rewrite kept). Final click-through both tracks, then sleep.

## Installs (done before restart)
- ECC: `affaan-m/ECC` via `npm install -g ecc-universal` + `ecc install` (harness: skills/instincts/memory/security).
- Skills: `mattpocock/skills` via `npx skills@latest add mattpocock/skills` (engineering skills, run `/setup-matt-pocock-skills` after restart).

## Restart gate
After installs, STOP. User restarts session, then build starts at step 1 in `avsar SIH 2026/` only.
