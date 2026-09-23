# 01: Role roadmap timeline

**What to build:** picking a role shows a Sem 6 → Sem 7 → Sem 8 timeline, each step with one free link, visible before any resume upload and working fully offline.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Role switch re-renders timeline steps + links for that role
- [x] All links are free (reuse existing course/job URLs, no new sources)
- [x] `npm run build` passes

## Comments

Built: `ROADMAP` in `src/data/courses.js` (reused URLs), timeline box in `App.jsx` middle column, role-driven, offline. Build green.
