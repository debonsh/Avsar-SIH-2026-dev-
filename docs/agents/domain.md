# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`PRD.md`** at the repo root (the spec for Campus2Corporate).
- **`CONTEXT.md`** at the repo root, if it exists (none yet — proceed silently).
- **`docs/adr/`**: read ADRs that touch the area you're about to work in (none yet — proceed silently).

## File structure

Single-context repo:

```
/
├── PRD.md
├── app/src/                 ← Vite + React (all UI in App.jsx, domain in lib/ + data/)
└── .scratch/c2c-phase1/     ← local issue tracker
```

## Glossary (use these terms, not synonyms)

- **ATS score**: 0–95 transparent rubric (Skills 30 / Keywords 20 / Experience 25 / Format 15 / Impact 10).
- **Gap**: a required role skill missing from the resume, always paired with a free fix link.
- **College battle**: seeded college averages + live user score (private score, never public resumes).
- **Slice**: one demoable vertical cut (upload → score → gaps → jobs).

## Flag ADR conflicts

If your output contradicts a locked decision (private-not-public leaderboard, curated-not-scraped jobs, text-not-voice interview), surface it explicitly rather than silently overriding.
