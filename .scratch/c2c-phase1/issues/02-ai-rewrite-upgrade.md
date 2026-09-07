# 02: AI rewrite upgrade

**What to build:** the "AI rewrite my bullets" button gives role-tuned, concise rewrites when `VITE_GEMINI_KEY` is set, and a harmless local fallback with clear messaging when it isn't — no dead button on stage.

**Blocked by:** 01 (same `App.jsx` region; serialize edits).

**Status:** resolved

- [x] Prompt tuned per role (passes role label + missing skills, caps length)
- [x] No-key path shows local guidance instead of failing silently
- [x] Loading + error states render inline
- [x] `npm run build` passes

## Comments

Tuned: prompt now gets `score/95 + breakdown` so AI references your number. No-key/loading/error paths already existed — verified, not rebuilt. Build green.
