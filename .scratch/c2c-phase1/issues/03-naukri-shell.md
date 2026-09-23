# 03: Naukri-style shell + tabbed views

**What to build:** app opens on a Jobs home like Naukri; header nav switches one view at a time (Jobs / My Score / Roadmap / Interview / Battle) so features stop shouting all at once. All existing logic reused, zero new deps.

**Blocked by:** None (Phase 2 frontier).

**Status:** resolved

- [x] Default view is Jobs; nav switches views, header shows live ATS pill
- [x] Score view reads as steps 1 Role → 2 Upload → 3 Score → 4 Fix gaps
- [x] No feature lost in the move (upload, score, gaps, jobs, roadmap, interview, battle all reachable)
- [x] `npm run build` passes

## Comments

Tabbed shell in `App.jsx` (view state, shared `card`/`rolePills`). Same logic, zero new deps. Build green.
