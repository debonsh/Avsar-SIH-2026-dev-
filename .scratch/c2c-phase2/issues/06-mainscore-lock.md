# 06: MAIN_SCORE lock (Slice 0)

**What to build:** pure `calculateMainScore(ats,voice,proof,role)` + `rankFor()` in `src/lib/score.js`, one honest MAIN preview line under the ATS number. ATS path untouched.

**Blocked by:** None.

**Status:** resolved

- [x] Tech 0.5/0.3/0.2, non-tech 0.6/0.3/0.1, clamped, rounded
- [x] ATS 81 SDE shows MAIN 41 Bronze (voice/proof pending) — deliberately low, not faked
- [x] `node --test` 4/4 + `npm run build` green

## Comments

Verified: 80/70/60 -> 73 tech, 75 non-tech. No UI gating changed; voice/proof slices raise MAIN when they land.
