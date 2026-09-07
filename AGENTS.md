# AGENTS.md

- Stack: Vite + React + Tailwind v4 + Supabase (planned) + Gemini Flash, npm, in `app/`. Not a git repo.
- Setup: `npm install` in `app/`; copy `app/.env.example` to `app/.env` and set `VITE_GEMINI_KEY` (optional, app works offline without it).
- Dev: `npm run dev` in `app/` (Vite). Verify: `npm run build` in `app/`.

## Agent skills

### Issue tracker

Local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults (`ready-for-agent` etc.). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`PRD.md` + glossary; no CONTEXT.md/ADRs yet). See `docs/agents/domain.md`.
