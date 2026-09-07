# PRD — Campus2Corporate (AI Career Readiness, Hackathon Practice Build 1)

> Source: grill-me session Q1–Q13 + Part 1 build in `app/`. Stack locked: Vite + React + Tailwind v4 + Supabase (planned) + Gemini Flash.

## 1. Problem Statement

Thousands of Tier-2/3 students graduate yearly without awareness of industry expectations, internships, certifications, and employment pathways. Institutions can't give personalized guidance at scale.

Hackathon brief (8 boxes to tick): analyse profiles + recommend career paths + skill gaps + courses/certs + match internships/jobs + resume improvement + mock interviews + govt opportunities. Vision: Campus to Corporate.

Student pain (from user idea): resume is weak for a target company, doesn't know what's missing, friction of hunting certs/projects across 10 sites. Wants: upload resume → see eligible roles → get exact free fix → re-upload → score rises.

## 2. Solution

Single web app, one demo loop (3 min):

**Upload resume → transparent ATS score → missing skills with free links + 1 project → matched jobs (locked/unlocked by score) → save score → college battle moves → text mock interview.**

Gamification = private score + levels + seeded college battle (NOT public resume leaderboard — privacy + demotivation risk killed in Q3).

Works offline with local rubric. Add `VITE_GEMINI_KEY` to unlock AI rewrites + AI interview grading. PDFs parsed in-browser, never uploaded (judge line).

## 3. Users

- Primary: final/pre-final year Tier-2/3 students (one persona for sharp demo).
- Secondary: judges (need 30-sec comprehension + ethics answer).
- Non-user: recruiters (out of scope — outbound Apply links only).

## 4. User Stories

1. As a student, I want to pick a target role (SDE / Data Analyst / Marketing / Govt), so that scoring is relevant.
2. As a student, I want to upload a PDF or paste resume text, so that I don't get blocked by parse failures.
3. As a student, I want a 0–95 ATS score with 5-bar breakdown (Skills 30 / Keywords 20 / Experience 25 / Format 15 / Impact 10), so that I trust the number and can argue it in Q&A.
4. As a student, I want to see top-3 missing skills each with free course links (NPTEL/SWAYAM/YouTube/freeCodeCamp), so that I know what to do next without searching.
5. As a student, I want 1 role-specific project idea, so that I can close the gap this week.
6. As a student, I want jobs filtered to my role, each showing matched-skills count and eligible (score ≥ minScore) vs locked with points-needed, so that I apply only where credible.
7. As a student, I want real Apply links (Internshala/Naukri/LinkedIn/SSC/IBPS/UPSC/NATS), so that action is one click.
8. As a student, I want AI bullet rewrites (Gemini, optional), so that my resume sounds stronger.
9. As a student, I want to save my score and watch my college avg move on a battle board, so that I feel competition without exposing my phone/email.
10. As a student, I want a 5-question text mock interview for my role with instant grading (local STAR tip + optional AI score), so that I can demo interview prep in 60 sec.
11. As a judge, I want the whole loop to run offline with one sample-resume button, so that stage Wi-Fi can't kill the demo.
12. As a judge, I want to hear the privacy line ("PDF never leaves browser, only text+score kept"), so that I give ethics points.

## 5. Implementation Decisions (what's built)

- Single repo in `app/`: `src/App.jsx` (all UI, beginner-readable), `src/lib/score.js` (transparent keyword rubric, Gemini enriches but logic stays), `src/lib/gemini.js` (null-safe wrapper, local fallback), `src/data/jobs.js` (12 curated jobs + `matchJobs`), `src/data/courses.js` (free-links map + project ideas), `src/data/colleges.js` (3 seeded colleges).
- No backend in Build 1. Supabase planned for auth/DB/store in rebuild; currently college data is in-memory + seeded.
- PDF parse: dynamic `pdfjs-dist`, worker via unpkg CDN, first 3 pages only, file input cleared immediately.
- Roles fixed to 4 (sde/data/marketing/govt) — each with skills list, keywords, interview Qs, project ideas. Adding a role = one entry per file.
- ATS cap 95 (never 100 — leaves headroom for re-upload gamification).
- Tailwind v4 via `@tailwindcss/vite`, dark theme, 3-column grid (input / score / jobs).

## 6. Testing Decisions

- Manual demo test only for Build 1: sample resume → score >0, breakdown sums, gaps show links, jobs sort eligible-first, save-score bumps college avg, mock grade renders with and without key.
- Good test = external behavior (score rises after adding a missing skill to text), not implementation detail.
- Before rebuild: add 1 `score.test.js` (hits/miss math) — no framework beyond `node --test` if possible.
- Verify: `npm run build` in `app/` (currently passing).

## 7. Out of Scope (Build 1, cut on purpose)

- Public resume leaderboard with PII; live Naukri/LinkedIn scraping; voice/video interview analysis; separate Python backend; auth/DB persistence; career-roadmap timeline visualization (planned Part 2); real-time multi-user leaderboard.

## 8. Demo Script (3 min)

0:00 "Tier-3 student, no mentor." → pick SDE → Try sample (score ~55). 0:40 breakdown bars → "here's why 55." 1:10 gaps → click free Striver/NPTEL link → "zero friction." 1:40 jobs → 1 eligible Apply, 1 locked "need 15 pts." 2:10 Save score → college avg moves. 2:30 mock interview 1 Q + Grade. 2:50 privacy line + "works offline, AI unlocks with key." Close.

## 9. Risks + Mitigations

- Fake-score accusation → transparent rubric + evidence shown.
- Stage network fail → local mode default, curated data, sample button.
- PDF parse fail → paste-text fallback + sample.
- Scope creep (voice/video/live jobs) → cut until slice done (rule from Q13); rebuild after 10 days adds polish.

## 10. Next (Parts 2–3)

- Part 2: Gemini rewrite quality pass + roadmap timeline (Sem 6→8) + `.env` docs.
- Part 3: Supabase save/scores, polish battle eyecandy, pitch lines, rebuild prep.
