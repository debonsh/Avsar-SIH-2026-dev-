# 03: Career GPS — a route, not a reading list

**What to build:** graph search over the taxonomy `related[]` edges from what the student already holds to a target role, ordered by real unlocks in the live corpus, with a counterfactual simulator that says what a skill unlocks before the student invests the effort.

**Blocked by:** 01 (unlocks need a dated, lane-correct corpus).

**Status:** done

- [x] `src/lib/careerGps.js`: `skillGraph`, `rolesForLane`, `routeTo`, `simulate`, `effortHours`
- [x] `rolesForLane` returns the four ayush taxonomy roles for the ayush lane and the four tech roles for the tech lane
- [x] Unlocks are grounded: a gap skill's `unlocks` counts lane-corpus postings whose fit crosses that posting's own `minScore` once the skill is added
- [x] `simulate` calls `matchJobPost` for the before and after states so it cannot drift from the engine (reuse, do not reimplement)
- [x] `effortHours` names the real course and its hours from `programs.js` (ayush) or `techPrograms.js` (tech); never a calendar promise
- [x] Zero held skills, already-satisfied target, and disconnected graph nodes all handled without crashing
- [x] `tests/careerGps.test.js` covering both lanes, the spec's four edge cases, and route determinism
- [x] `src/pages/CareerGps.jsx` at `/gps`: lane-aware target role picker, numbered stop strip with unlocks, hours and program names, simulator with skill toggles and a verified switch, `CountUp` deltas, unlocked postings linking into the feed
- [x] `/journey`: the Improve tab links into `/gps` with the current gap list
- [x] Nav entry for `/gps` in both engines with label keys in both i18n dicts
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green

## Comments
**Status: done.** What landed:

- `src/lib/careerGps.js`: `skillGraph`, `rolesForLane`, `hopDistances`, `programsForSkill`, `effortHours`, `simulate`, `routeTo`, `gapList`. 23 cases in `tests/careerGps.test.js`.
- One breadth-first walk from every held skill at once, carrying both the distance and which held skill the walk arrived from, so a step can say "one step from react" without re-running a search per gap.
- Unlocks are earned: a step only claims a posting if re-scoring that posting with the skill added clears its own `minScore`, and only postings that actually require the skill are re-scored, which keeps a whole route to one cheap pass per step. A test re-derives the claimed set independently and asserts equality.
- Roles are derived from the taxonomy domain rather than listed twice, so adding a role to `taxonomy.js` is enough to make it reachable.
- `effortHours` sums the cheapest listed course per stop and reports the stops nothing in the catalogue covers as `unknown` rather than as zero.

**A finding the plan did not anticipate:** the taxonomy's `related[]` edges form a graph with genuinely disconnected clusters. From `react`, 49 of 62 skills are reachable and the design, data-visualisation and govt-exam groups are not, so `hops === Infinity` is reachable with real data rather than only in theory. The route lists those last and says "no route from your current skills, so this is a fresh start". Two of my own test assertions were wrong about this before the measurement corrected them.
**Closed in a second pass.** The unlocked list and each step's own posting list now open `/jobs`, so a route ends in the feed rather than in a list nobody can act on (CG-10).
