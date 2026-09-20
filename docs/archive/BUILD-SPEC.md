# C2C Build Spec (hackathon wedge)

## What we are making

A single-player career loop that works with zero other users: upload a resume, get a transparent score, follow a generated roadmap, prove skills through tests plus project interrogation, earn scarce badges, unlock jobs, and show a verified portfolio. One simulated season board and one squad card demonstrate the social future. Everything labeled simulated is labeled.

## OUT (cut for the hackathon)

DMs and any chat UI. Global solo leaderboard. Scraped live feeds (jobs, freebies). Extra profile fields beyond ID, badges, proof, handles. Human or peer review anywhere. Supabase writes (reads stay best-effort). Follower counts and public vanity metrics.

## IN (build list)

1. **XP ledger** (`app/src/lib/xp.js`, new; `app/tests/xp.test.js`). Sources: quest pair accepted 100 (300/week cap), cert test pass 150 (distinction 250), quiz new best 20, streak day 10, interrogation pass 150. Levels from lifetime XP: L1 0, L2 300, L3 800, L4 1500, L5 2500. Only verified actions pay. Diminishing returns enforced in code, not policy.
2. **Evidence ownership check** (`app/src/lib/progress.js` `setEvidence` gate; tests). GitHub host URLs must contain the stored handle from `identity.js`. Reject with a message, never crash.
3. **Project interrogation** (`app/src/lib/coach.js` new `interrogateProject`; prompt builder plus `localAnswer`-style fallback; tests with mocked adapters). Three questions generated from the evidence content. Gemini grades with a rubric when keyed, local keyword-plus-substance grading otherwise. Pass pays XP, fail pays nothing, retake after cooldown.
4. **Badge revoke flag** (`identity.js` record gains `revoked`; `PortfolioView.jsx` renders revoked state; tests). Caught fakes stay visible as revoked.
5. **Simulated season board** (seed file plus small render in battle view, header labeled SIMULATED). Three clans, team totals, reset countdown. No real user scores.
6. **Squad card** (static component, labeled SIMULATED). Three sample members with verified skills plus MAIN, coverage grid against one sample company brief.
7. **Todos from roadmap** (extend `c2c-progress-v1`; checkbox UI on roadmap tasks; streak engine reused, not rebuilt).
8. **Digest shelf** (reuse `courses.js`; static weekly-shelf render; no scraping, no push).

## Demo script (3 minutes)

0:00 personal problem, one sentence. 0:20 upload resume, ATS plus gaps. 0:50 roadmap plus todo. 1:20 interrogation live, badge unlocks, rank jumps. 2:00 jobs unlock, squad card. 2:30 simulated season, labeled. 2:50 close: wedge today, clans with moderation next, squad marketplace after density.

## Acceptance

`npm run build` clean. New tests green alongside the existing 48. No dead controls: every button works or is a labeled coming-soon panel. No em dashes in UI copy. No tier labels. No fabricated scores without SIMULATED labels.
