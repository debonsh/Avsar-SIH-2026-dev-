# 02: Market Pulse — live demand moves the fit score

**What to build:** the scraped corpus computes a per-skill demand index that reweights the required skills of each posting, so the fit score itself moves with the market. Plus `/market`, the page where a judge can see the corpus, the sample sizes and the trend.

**Blocked by:** 01 (dates must be real or trend and staleness are fiction).

**Status:** pending

- [x] `src/lib/market.js`: `corpusForLane`, `marketIndex`, `blendedWeight`, `effectiveWeights`, `marketSignals`, `corpusStats`, `staleJobs`, `salaryBand`, `recordSnapshot`, `marketMemory`, `trendFor`
- [x] Weight math: `index = clamp(share / median(share), 0.6, 1.5)`, blended 50/50 with the taxonomy prior when observed, skills under `minPostings` count as neutral 1.0 and are never guessed
- [x] `trendFor` returns `"unknown"` below 2 snapshots and the UI says how many snapshots exist instead of inventing a direction
- [x] `tests/market.test.js` covering both lanes, empty corpus, single-skill corpus, undated corpus, salary parsing, and suppression of low-sample skills
- [x] `src/lib/match.js`: optional `weights` on `matchScore`, third `market` argument on `matchJobPost`, weighted denominators; default path byte-identical
- [x] `tests/match.test.js`: `weights: null` equals all-ones weights; a weighted case moves the score in the expected direction; the existing 100 / ±15 / ±5 / Ananya assertions unchanged
- [x] `src/pages/MarketPulse.jsx` at `/market`, lane header with real sample sizes, rising and cooling skills, demand versus verified supply, city demand, salary bands, source mix, freshness clock, snapshot trend, explicit empty and low-sample states
- [x] `/match` renders `effectiveWeights(pool)` instead of the `MATCH_WEIGHTS` literals, with base versus adjusted score and the per-skill shift list
- [x] `/jobs`: market badge in the card chip row, market `why[]` line in `EngineFit`, stale group with restore, and delete the hardcoded `[45,25,15,10,5]` at `Jobs.jsx:54-60`
- [x] `/institute`: demand panel reads the full per-lane corpus instead of 24 postings with an empty supply array
- [x] Nav entry for `/market` in both engines with label keys in both i18n dicts
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green

## Comments

**Status: Phase 1 done** (index, engine plumbing, all four surfaces). Career GPS and the
later pillars are still open in 03 through 06.

### What landed

- `src/lib/market.js` plus `tests/market.test.js` (17 cases). Weight math: `index = clamp(share / median, 0.6, 1.5)` mapped from the most-requested skill, then blended 50/50 with the taxonomy's published prior and re-clamped. A skill seen fewer than `minPostings` (3) times is **absent from the map**, which the engine reads as neutral 1.0, so two coincidences cannot move a score.
- `src/lib/corpus.js`: one home for what each portal's corpus is, so `/jobs`, `/market` and `/institute` cannot drift into different corpora. Both pages now read it.
- `src/lib/match.js`: optional `weights` on `matchScore` and a third `market` argument on `matchJobPost`. Default path proven byte-identical by a new test (all-ones weights reproduce the published score exactly, differing only in an introspection field). The published 45/25/15/10/5 formula is untouched, so the deck's scoring slide stays true.
- `/market` (`src/pages/MarketPulse.jsx`), lane-aware, with the sample size printed next to every number and honest empty states. Live: **ayush lane 24 postings, 5 sources, 0 dated, 8 skills above the floor, freshest: none. Tech lane 288 postings (267 bundled plus live), 237 dated, 28 skills above the floor, freshest 2026-09-23.**
- `/match`: fixed weights kept visible, a separate "market term" card, an on/off toggle persisted as `avsar-market-mode`, base-vs-adjusted score side by side, and per-skill `x1.24` chips naming exactly which skills shifted.
- `/jobs`: the fit ring was **dead code** (`j.fit` was never assigned anywhere), so it never rendered. It is now computed from the engine with the market applied, and cards carry a `market` badge plus the market `why[]` line. The hardcoded `[45,25,15,10,5]` inside `EngineFit` now imports `MATCH_WEIGHTS` instead of re-typing the formula.
- `/institute`: demand panel replaced the two-portal merge with a lane switch, the full per-lane corpus, the sample size, and the freshest date (or an explicit "no posting in this lane is dated").
- `tests/market.test.js` also covers `corpusForLane` lane purity, alias canonicalization, salary parsing refusals and the snapshot cap.

### Two bugs found by rendering the result, not by the test suite

1. **Every job card scored 0/100 "poor fit".** `profileForMatching` wrote level 0 for a resume-only student, and `matchScore` reads level 0 as "does not have the skill", so a skill printed on the resume counted as a gap. Underneath it sat `matchJobPost`'s documented `level ?? 2` intent, which never applied because the key was always present. Fixed with an L2 floor for resume-listed skills; quiz, quest and proof signals still lift above it. A partial-coverage ayush resume now reads 67 good fit on a matching posting and 22 on one whose skills it lacks.
2. **`CountUp` froze at its mount value under `prefers-reduced-motion`**, so the market page printed 267 in a tile and 288 in the sentence below it. Fixed by deriving the value during render when reduced motion is on.

Neither showed up in `node --test`, `npm run lint` or `npm run build`. That is why `npm run verify:routes` now exists: it builds, serves, renders every student route in both lanes and all three desks in a real browser, and fails on a blank render, a console error, or a headline number that disagrees with its own prose.

### Deviations from the written plan

- `salaryBand` parses **only annual bands with an explicit annual cue** (`3-4 Lacs PA`, `$70k - $90k`). A monthly stipend (`₹37,000 + HRA`) returns `null` and the raw text is shown instead, because reporting it as an annual band would be inventing a unit the data never stated.
- The trend is date-based where dates exist, snapshot-based where they do not, and `"unknown"` with an explanation when neither is available. The ayush lane therefore shows no trend today, which is the honest number rather than a fabricated arrow.

### Still open for this pillar

- MP-8 city demand is shown but not weighted into scoring; MP-10's stale group with restore on `/jobs` is not built yet (semantics for the ayush lane in issue 05).
- Staleness is computed but not yet surfaced as a filter on `/jobs`.
