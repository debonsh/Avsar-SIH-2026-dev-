# Resources — Campus2Corporate Hackathon Prep

## Project source (canonical, read-first)

- `PRD.md` — full problem/solution/users/stories/decisions/demo-script (78 lines)
- `ARCHITECTURE-REVIEW.md` — 5 deepening candidates ranked by strength (175 lines)
- `AGENTS.md` — stack, setup, dev commands
- `app/src/App.jsx` — all UI, 258 lines, beginner-readable
- `app/src/lib/score.js` — transparent ATS rubric (Skills 30 / Keywords 20 / Experience 25 / Format 15 / Impact 10, capped at 95)
- `app/src/lib/gemini.js` — null-safe Gemini wrapper, local fallback
- `app/src/lib/parseResume.js` — in-browser PDF parse via pdfjs-dist
- `app/src/data/jobs.js` — 12 curated jobs + `matchJobs(role, score, found)`
- `app/src/data/courses.js` — NPTEL/SWAYAM/YouTube/freeCodeCamp link map + `PROJECT_IDEAS` + `ROADMAP`
- `app/src/data/colleges.js` — 3 seeded colleges + `recomputeCollegeAvg` (extracted per architecture review Candidate 1)
- `app/src/data/interview.js` — `INTERVIEW_QS` by role (extracted per Candidate 3)
- `app/src/data/fixtures.js` — `SAMPLE_RESUME` text (extracted per Candidate 3)

## External — Hackathon rules

- https://innovate.mponline.gov.in/ — official portal (rules, themes, judging criteria, submission format)
- Themes commonly tracked: Digital India, Skill India, Education, Employment, Citizen Services, MSME

## External — Domain knowledge

- ATS scoring fundamentals: how real ATS systems (Workday, Greenhouse, Taleo) parse and rank resumes
- NPTEL / SWAYAM / DigiLocker — govt free-cert platforms (huge judging signal for "free + Indian")
- NATS (National Apprenticeship Training Scheme) — listed in jobs as govt internship pathway
- SSC / IBPS / UPSC — listed in jobs as govt job exam pathways

## External — Tech docs

- Vite + React 19 docs (current build)
- Tailwind v4 via `@tailwindcss/vite` (note: v4 syntax differs from v3 — no `tailwind.config.js`)
- `pdfjs-dist` worker config (current: unpkg CDN — flag for offline reliability)
- Supabase auth + Postgres for Part 3 save/scores
- Gemini Flash API (`@google/generative-ai` v0.24)

## Community (wisdom layer)

- Devfolio / Unstop Discord servers — past MP hackathon participants
- r/developersIndia — Indian hackathon ecosystem
- Local college hackathon alumni — past judges' rubrics
