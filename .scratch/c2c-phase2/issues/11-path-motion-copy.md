# 11: Path finder + motion fix + copy pass

**What to build:** (a) `rankRoles()` in score.js + best-fit suggestion chip in Step 1 — covers the problem-statement "recommend career paths" bullet, the one checklist item with no feature. (b) Motion tuned for Operate: FadeUp 0.45->0.28s + delay cap, TextReveal 2x faster, Meter as CSS transition (keystroke re-scores glide), Tilt off the score card, static under prefers-reduced-motion. (c) No-slop copy: cut false "recruiters see full profiles" claim + jargon ("profile-matched recommendations", "instant grading").

**Blocked by:** None.

**Status:** resolved

- [x] Data-heavy resume suggests Data Analyst (data:21 > sde:9) — verified
- [x] Chip only shows when suggestion differs from selected role; one click switches
- [x] SSR render green, tests 4/4, `npm run build` passes

## Comments

Problem-statement coverage now 8/8: analyze, paths, gaps, courses, jobs, AI rewrites, mocks, govt roles.
