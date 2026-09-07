# 0001 — Project Overview & Judge-Defence Briefing

**Date:** 2026-09-04
**Type:** Initial briefing (zone-of-proximal-development: novice → demo-ready)

## What I learned

- Campus2Corporate is a single-page Vite/React app in `app/` with **no backend in Build 1** — everything runs in-browser except optional Gemini calls
- The ATS rubric is **transparent by design**: Skills 30 + Keywords 20 + Experience 25 + Format 15 + Impact 10, capped at **95** (intentional headroom for re-upload loop)
- The **demo loop is exactly 3 minutes** and is scripted in PRD §8 — every minute has a purpose
- The privacy claim ("PDF never leaves browser") is a **judge line** — `pdfjs-dist` worker is loaded from unpkg CDN, so on stage Wi-Fi fail this claim breaks. This is the #1 weakness to fix.
- Roles are fixed to 4: **sde / data / marketing / govt** — each role owns its own skills/keywords/interview questions/project ideas
- The **leaderboard is private** (PII not exposed) — this was a deliberate kill in PRD Q3 after considering public ranking

## Key non-obvious insights

- "Save score → battle" is the **retention hook**, not just gamification — it makes the user commit a number, which is what the govt hackathon judges reward (action-taking > browsing)
- `App.jsx` is one 258-line file by **intentional choice** (PRD §5: "beginner-readable") — the architecture review (Candidate 3) flags this for future extraction but explicitly warns against premature refactoring
- Gemini integration is **null-safe**: missing key → local fallback → no crash. This is why the app "works offline" even though Gemini is a paid API.
- The `recomputeCollegeAvg` was just extracted from inline into `data/colleges.js` per Candidate 1 of the architecture review — the seed is decoupled from the merge, which unblocks Supabase in Part 3

## Questions I still have

- Which 8 hackathon "boxes" does MP Online actually score on? (need to verify against the live portal)
- Is the unpkg CDN worker a real offline risk or does pdfjs-dist cache it after first load?
- What's the actual judge's panel composition for MP Online Innovate — tech, policy, or mixed?

## Next session focus

- Drill the **judge Q&A prep** — every question in lesson 0001 mapped to a 2-sentence spoken answer
- Build the **2-minute version** of the demo for if the panel is running behind
- Pick the **top 3 must-do improvements** from the prioritised list and start shipping
