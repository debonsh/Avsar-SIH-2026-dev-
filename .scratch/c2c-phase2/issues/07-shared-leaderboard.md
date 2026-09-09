# 07: Shared leaderboard, one table (Slice 1)

**What to build:** `src/lib/supabase.js` with `getClient/loadBoard/submitScore/mergeBoards`; Battle merges remote avgs over seeded COLLEGES; offline/no-keys falls back to seeds; saveScore fire-and-forget submits.

**Blocked by:** 06 (rank formula).

**Status:** resolved (code) / needs-human (one-time SQL + env)

- [x] Never throws: null client, null board, false submit offline — all verified
- [x] Seeded board unchanged without keys (current .env has none)
- [ ] HUMAN: run SQL in header comment once in Supabase dashboard, set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in app/.env, restart dev
- [x] `npm run build` passes

## Comments

One table only (college_scores), anon open read/insert, no auth. Test shared: save from two browsers, reload, Your College avg moves.
