# 10: Landing page

**What to build:** Home view as default entry: hero + live sample proof (computed from SAMPLE_RESUME, not hardcoded) + 3 steps + privacy strip, CTAs into score/jobs. New `src/components/Landing.jsx`, 5-line NAV wiring in App.jsx.

**Blocked by:** None.

**Status:** resolved

- [x] Default view is home; sidebar + mobile nav pick it up automatically
- [x] Proof strip shows live ATS + eligible count, zero new logic
- [x] SSR render green (hero, CTAs, steps present), `npm run build` passes

## Comments

Demo hook now starts on Home ("Tier-2 student, no mentor...") instead of Jobs. Update 05-demo-rehearsal script 0:00 line accordingly.
