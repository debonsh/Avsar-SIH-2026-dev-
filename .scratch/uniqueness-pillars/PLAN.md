# Avsar Uniqueness Pillars — Reality-Corrected Implementation Plan

**Companion to:** `avsar SIH 2026/temp/avsar-uniqueness-prd.md` (the spec this replaces where the two disagree)
**App:** `avsar SIH 2026/` — the only folder agents touch
**Goal:** raise the judge uniqueness score from 5/10 by shipping five structurally absent features, **symmetrically for both student types**

## 0a. Status: all phases shipped

Every phase in this plan landed, and issues 01 through 07 in `issues/` are marked done with the details of what was built and what deviated.

| Phase | State |
|---|---|
| 0 Data spine | done, ayush lane carries no dates because no scraper exists in this repo and none were invented |
| 1 Market Pulse | done, plus the later upgrade: Live Wire feed, SVG chart library, hand-rolled dashboard |
| 2 Career GPS | done, `src/lib/careerGps.js`, `/gps`, `/journey` link |
| 3 Proof-of-Skill | done, `sign.js`, `challenges.js`, `/challenges`, `/shortlist`, v2 credentials |
| 4 District Thermometer | done, `district.js`, `/institute` panel with a k control |
| 5 `/labs` | done, public and unguarded, four live widgets |
| 6 Hardening | done, `tests/lanes.test.js`, README, stale group on `/jobs` |

**Verification:** 410 unit tests, `npm run lint` clean (5 pre-existing warnings), `npm run build` clean, and `npm run verify:routes` rendering every student route in both lanes plus all three desks in a real browser with no blank render, no same-origin console error and no headline number contradicting its prose.

**Three findings that changed the plan while executing it:**

1. The taxonomy graph has genuinely disconnected clusters, so `hops === Infinity` is a real state in routes, not a defensive branch.
2. 78 of 267 tech postings declare no skills. That inflated the denominator behind every demand share, so the market index now measures share against postings that list skills and reports the undeclared count separately.
3. `CountUp` under reduced motion froze at its mount value, so a headline tile could disagree with the sentence beneath it once live data arrived.

**Not done, deliberately:** the ayush lane still has no dated postings. A naukri scraper does not exist in this repo and inventing dates would have made every trend claim a fiction, so the lane reports zero dated postings and the trend column says `no signal yet`.

## 0. How this plan differs from the PRD

The PRD's strategy is right. Its facts are not. Five claims fail against the code and would send implementation down wrong paths:

| PRD claim | Reality | Consequence |
|---|---|---|
| "`taxonomy.js` holds 78 skills" | **62** static skills (`taxonomy.js:38-113`) + synthesised `approvedSkills()` rows | Size every loop, test and sample threshold to 62 |
| "`demandWeight` is nudged by postings via `match.js` recompute" | `match.js:65` only attaches `demandWeight(r.skill)` to `matched[].demand`. **It never enters the score** | Pillar 1 is a *new* scoring dimension, not wiring an existing hook. Also fix the false comments at `taxonomy.js:4` and `taxonomy.js:34` |
| Data spine = `boards.mjs` + `naukri.mjs` | The only real ISO dates arrive in `src/lib/store.js:292-336` and are **thrown away**: Remotive `publication_date`, Arbeitnow `created_at` | Add store.js to the data spine |
| (not mentioned) | `boards.mjs:90` joins Ashby `secondaryLocations` objects → `"loc": "[object Object]"` at `boardsSeed.js:540`. Board seed is **49 postings from 2 companies** (Stripe 25, Linear 24); Lever yielded 0 | Fix the bug; widen sources or the "market" is a two-company sample |
| `isEvidenceUrl` lives in `proof.js`; `crypto.subtle` "unavailable in node tests" | It is `src/lib/quests.js:21-24`. `crypto.subtle` **is** available in Node ≥ 19 | Tests exercise the real ECDSA path; the hash fallback is for old browsers only |

Missing from the PRD manifest: `src/lib/dates.js`, `tests/dates.test.js`, `tests/lanes.test.js`, `scripts/vendor/ayush-queries.json`, `src/data/challengeTemplates.js`.

## 1. Lane symmetry contract (new, non-negotiable)

The PRD treats ayush as a narrative and tech as the demo. That is the bug the user flagged. **Every pillar ships for both student types**, and the tests enforce it.

| Concept | Ayush lane (`track = "ayush"`) | Tech lane (`track = "tech"`) |
|---|---|---|
| Sub-lanes | one (`lane = "ayush"`) | four: `sde`, `data`, `marketing`, `govt` (`TECH_LANES`, `track.js:15`) |
| Target roles | `ayush-cra`, `ayush-qa`, `ayush-vaidya`, `ayush-research` | `sde`, `data-analyst`, `marketing-associate`, `govt-exams` |
| Programs (hours) | `src/data/programs.js` | `src/data/techPrograms.js` |
| Verified path today | `verifyState` / `skillConfidence` (`ayush/proof.js`) | `isVerified(skill, earned, github)` (`store.js:200-204`) |
| Corpus | 24 curated, undated, no `src` | 100 bundled + live feeds |

**Rules that follow:**
1. Every new lib module takes a `lane` (or a lane-filtered corpus) and must be exercised for both lanes in tests.
2. Every new page inherits the active track and offers a lane switch, so a judge can run the identical machinery as an ayurveda student and a tech student.
3. **Proof-of-skill must feed `verified[]` for both lanes.** Today the two lanes verify differently; if a passed challenge only lifts ayush, Pillar 3 boosts half the users. `profileForMatching` gets one lane-aware `verifiedFor(lane, skill)` source.
4. The ayush lane gets a **dated corpus of its own** (Phase 0), not a fallback story.

## 2. Phase 0 — Data spine (both lanes, dated)

| File | Change |
|---|---|
| `src/lib/dates.js` **(new)** | `parseRelativeDate(s, now)`, `toIso(v, now)`, `daysSince(iso, now)`, `isStale(postedAt, now, days)`. Handles `"Just now"`, `"1 day ago"`, `"3 days ago"`, `"2 weeks ago"`, `"30+ days ago"`, ISO, epoch. Deterministic: `now` always injected |
| `tests/dates.test.js` **(new)** | Table test: fixed `now`, exact expected ms per string; unknown input → `null`, never a guess |
| `scripts/boards.mjs` | Map `postedAt` from Greenhouse `updated_at`, Ashby `publishedAt`, Lever `createdAt`; fix `secondaryLocations` → `.map((l) => l.location ?? l).join(", ")`; tag `lane: "tech"`; widen the default token set from `scripts/vendor/{greenhouse,lever,ashby}.json` |
| `scripts/naukri.mjs` | `posted` → `postedAt` via `parseRelativeDate` (keep raw `posted` for display); `salary` → `salaryBand` output; accept `--lane=ayush\|tech`; write `src` + `lane` on every posting |
| `scripts/vendor/ayush-queries.json` **(new)** | AYUSH keyword set for the importer: `ayurveda`, `panchakarma`, `BAMS`, `ayurvedic pharma`, `herbal QA`, `pharmacovigilance`, `clinical research ayush` |
| `src/lib/store.js` | `toLiveJobShape`: add `postedAt: r.publication_date`, `src: "remotive"`. `toArbeitJobShape`: add `postedAt: new Date(r.created_at * 1000).toISOString()`, `src: "arbeitnow"`. Extend `ROLE_HINTS` (line 268) with ayush hints so `guessRole` can return an ayush lane, and filter by lane in `listLiveJobs` |
| `src/data/ayushSeed.js` | Add `src` and `postedAt` per posting from the real official notice dates (CCRAS / AIIA / Ministry of Ayush vacancy pages already linked as `apply`) |
| `package.json` | Add `"boards": "node scripts/boards.mjs"` (README:16 and `boards.mjs:4` already document it; the key is missing) and `"test": "node --test \"tests/*.test.js\""` |

**Exit:** every bundled posting in both lanes either has `postedAt` or is explicitly flagged undated; `npm run boards` works; `node --test` green.

## 3. Phase 1 — Market Pulse

### `src/lib/market.js` (new, pure)

```js
corpusForLane(jobs, lane)                  // -> job[]  (ayush | sde | data | marketing | govt | all)
marketIndex(jobs, { now, minPostings = 3 })
// { index: Map<skillId, weight>, sample: { total, dated, undated, skills }, median, at }
blendedWeight(skillId, index)              // -> 0.6..1.5 | null when unobserved
effectiveWeights(jobs, opts)               // -> { weights: Map, sample, sources, freshestAt, shifts }
marketSignals(jobs, { now })               // -> [{ skill, postings, share, weight, trend, cities, sources, sampleOk }]
corpusStats(jobs)                          // -> { total, bySource, byRole, byCity, freshestAt, dated, undated }
staleJobs(jobs, now, days = 30)            // -> { fresh, stale, undated }
salaryBand(job)                            // -> { min, max, band, raw } | null   ("Not disclosed" -> null)
recordSnapshot(jobs, now)                  // -> entry ; key avsar-market-history-v1
marketMemory()                             // -> [{ at, byLane: { total, perSkill } }]
trendFor(skill, memory, index)             // -> "rising" | "stable" | "cooling" | "unknown"
```

Weight math (decided): `share = postings(skill) / total`; `index = clamp(share / median(all shares), 0.6, 1.5)`; skills under `minPostings` are **absent from the map → neutral 1.0**, never guessed. When a skill is observed, blend the static prior per MP-3: `clamp(0.5 * taxonomyDemandWeight + 0.5 * index, 0.6, 1.5)`.

Trend needs history: `trendFor` returns `"unknown"` until 2+ snapshots exist, and the UI says "1 snapshot so far" instead of inventing a direction (PRD edge case, kept).

### `src/lib/match.js` — opt-in, default byte-identical

```js
export function matchScore({ required = [], held = [], tags = [], interests = [], now = Date.now(), weights = null } = {})
// w(s) = weights ? (weights.get?.(s) ?? weights[s] ?? 1) : 1
// weighted denominators: Σw(required) replaces req.length in coverage, proficiency,
// verified and recency. All-1 weights reproduce today's output exactly.
export function matchJobPost(job = null, heldProfile = {}, market = null)
// -> base result + market: { applied, sample, shifts: [{ skill, weight, base }] } | null
```

`match.js` does **not** import `market.js` — pages compute the Map once and pass it in. This keeps the published 45/25/15/10/5 formula literally true, keeps `tests/match.test.js:10`'s exact-equality assertion passing, and keeps the deck's scoring slide honest.

### UI

| Surface | Change |
|---|---|
| `/market` (`src/pages/MarketPulse.jsx`, **new**) | Lane header with real sample sizes ("AYUSH lane, 24 postings, 12 dated, freshest 6 Sep"), rising/cooling skills, demand vs verified supply, city demand, salary bands, source mix, freshness clock, snapshot trend, explicit empty/low-sample states |
| `/match` | Render weights from `effectiveWeights(pool)` instead of `MATCH_WEIGHTS` at `Match.jsx:66,76,80,110`; base vs adjusted score side by side; per-skill shift list; market toggle |
| `/jobs` | Market badge in the chip row (`Jobs.jsx:462-468`); market `why[]` line inside `EngineFit`; **delete the hardcoded `[45,25,15,10,5]` at `Jobs.jsx:54-60` and import `MATCH_WEIGHTS`** (it already breaks the no-page-local-math rule); stale group with restore |
| `/institute` | Demand panel reads the full per-lane corpus (replaces `demandHeatmap([...AYUSH_JOBS, ...JOBS], [], 8)` at `Institute.jsx:34`) |
| `shell.jsx` | `/market` into `ENGINE[track].more` for **both** engines + label keys in both `i18n.js` dicts (`tests/i18n.test.js` enforces parity) |

## 4. Phase 2 — Career GPS

### `src/lib/careerGps.js` (new, pure)

```js
skillGraph()                                   // Map<skillId, Set<skillId>> from related[]
rolesForLane(lane)                             // 4 ayush roles | 4 tech roles (from TAXONOMY_ROLES)
routeTo(targetRoleId, held, { jobs, limit = 8 })
// [{ skill, hops, fromSkill, unlocks, postings: [jobId], programs: [{ id, title, provider, hours }], reason }]
simulate({ add = [], held, jobs, lane, weights, threshold = 45 })
// { before: { eligible, avgFit }, after: { eligible, avgFit }, deltaFit, unlocked: [job], locked: [job] }
effortHours(steps, lane)                       // { hours, known, unknown } — reads programs.js | techPrograms.js
```

- Unlocks are **grounded**: a gap skill's `unlocks` counts lane-corpus postings whose fit crosses that posting's own `minScore` once the skill is added. `simulate` calls `matchJobPost` for before and after so it cannot drift from the engine (CG-7).
- Performance: memoise per profile; worst case ~62 skills × ~100 postings, computed once per render in a `useMemo`, single pass, no layout thrash.
- `effortHours` has real data: `programs.js` and `techPrograms.js` both carry `hours` + `skills[]`, so each stop names the actual SWAYAM / NPTEL / CCRAS / RAV course. Calendar promises are forbidden (CG-8).
- Disconnected nodes: `hops = Infinity` for ordering, still listed, never crash.

### UI
- `/gps` (`src/pages/CareerGps.jsx`, **new**): lane-aware target-role picker (CRA / Herbal QA / OPD Vaidya / CCRAS Fellow vs SDE / Data / Marketing / Govt), numbered stop strip with unlocks + hours + program names, simulator with skill toggles and a verified switch, `CountUp` deltas, unlocked postings linking into the feed.
- `/journey`: the Improve tab links into `/gps` with the current gap list, so first login ends on a route.

## 5. Phase 3 — Proof-of-Skill hiring (both lanes)

### `src/lib/sign.js` (new)
`generateIssuerKeypair()`, `signPayload(payload, key)`, `verifySigned(payload, sig, jwk)`, `fingerprint(jwk)`, `chainHash(prev, payload)`, `signingMode()` → `"ecdsa-p256" | "hash-fallback"`, `canonicalJSON(payload)` (sorted keys, so verification is stable). WebCrypto ECDSA P-256, JWK in `avsar-issuer-key-v1`. Degrade to the existing `hashStr` mode and **label the mode in the UI and on the receipt** — never claim crypto strength that is absent.

### `src/lib/challenges.js` (new)
Challenge store `avsar-challenges-v1`, submissions `avsar-submissions-v1`, audit `avsar-shortlist-audit-v1`. `gradeSubmission` mirrors the `score.js` rubric style: weighted clamped terms, evidence URL gated by `isEvidenceUrl` (`quests.js:21`), `why[]` on every result, no AI scoring. `blindId(deviceId, challengeId, salt)` via SHA-256 with hash fallback. `rankSubmissions`, `shortlist(list, { threshold })`, `revealIdentity(id, { by, reason })` → audit entry.

### Lane parity hook
`profileForMatching` gains one lane-aware verified source: a skill verified by a passed challenge joins `verified[]` for **both** lanes, alongside ayush `verifyState` and tech `isVerified`.

### Seeds and routes
- `src/data/challengeTemplates.js` (**new**): 6 offline challenges — ayush: supervised case-log review, ADR write-up to PvPI, GMP SOP audit; tech: ship a page, SQL analysis, analytics dashboard. Both lanes demo with zero setup.
- `verify.js`: v2 signed credentials **alongside** v1; v1 codes must keep validating (add a regression test with a frozen v1 code string).
- Routes: `/challenges` (both student lanes), `/shortlist` (**requires** `DESK_SEGMENTS.shortlist = ["industry"]` in `rbac.js:23-28` plus a guarded route, otherwise it silently becomes student-only), `/industry` gains post-a-challenge.
- `/portfolio`: receipt card + QR (the `qrcode` dep and `Portfolio.jsx:45-55` canvas pattern already exist).

## 6. Phase 4 — District Thermometer

`src/lib/district.js` (new): `districtDemand(jobs)`, `unmetDemand(demand, supply)`, `capacityPlan(unmet, { batchSize })`, `privacyAggregate(rows, k = 5)` returning `{ buckets, suppressed }` so suppression is **visible, not silent**, plus a signed export via `sign.js`.

UI: `/institute` gains a lane switch, unmet local demand, batch recommendations, a k control defaulting to 5, and an explicit "insufficient cohort size" state — never an empty chart, and never a figure aggregating across lanes (DT edge case). `/faculty` reads the same corpus for curriculum alignment.

## 7. Phase 5 — `/labs`, the judge page

`src/pages/Labs.jsx` (new), **public** — which needs two edits, not one: add `"labs"` to `PUBLIC_SEGMENTS` (`rbac.js:15`) **and** an unguarded `<Route>` in `shell.jsx:416-438`. Nav is suppressed pre-onboarding, so the entry point is a link from `Welcome.jsx`.

Four live widgets with a lane toggle: market recompute, route simulation, blind shortlist preview, offline receipt verification. Plus the comparison table, a 60-second click-by-click demo strip, and an explicit "works with zero keys and no network" note. Copy rules: no em dashes, no emoji.

## 8. Phase 6 — Hardening

README section; copy pass on every new page; `tests/lanes.test.js` (**new**) asserting the symmetry contract: each lane has roles, programs covering its gap skills, challenge templates, and non-empty market signals from the bundled corpus; then `node --test "tests/*.test.js"`, `npm run lint`, `npm run build`, and `graft build` per AGENTS.md.

## 9. Verification

**Automated** (inside `avsar SIH 2026/`)
```
node --test "tests/*.test.js"   # all existing suites green + dates, market, careerGps, sign, challenges, district, lanes
npm run lint                    # oxlint clean
npm run build                   # clean
```
New in `tests/match.test.js`: market weights `null` ≡ all-ones weights; a weighted case moves the score in the expected direction; the existing 100 / ±15 / ±5 / Ananya cases unchanged, proving the default path is byte-identical.

**Manual, no keys, no network** — run once per lane
1. `/labs` renders before onboarding completes.
2. `/market` sample counts match the seed headers for the active lane.
3. `/match` shows live weights; the market toggle visibly moves a fit score; the shift list names the skills.
4. `/gps` simulates adding a skill; unlocked postings match the real feed; steps name real courses with hours.
5. Post a challenge, submit as a student, appear in `/shortlist` as a blind handle, shortlist, reveal, confirm the audit entry.
6. `/verify/<code>` validates a v2 receipt; a one-character edit fails with a tamper message; a v1 code still validates.
7. `/institute` shows unmet demand, a capacity figure, and a visibly suppressed bucket below k.
8. Airplane mode: repeat 2, 4 and 5.

## 10. Risks and cut order

| Risk | Mitigation |
|---|---|
| Ayush lane live yield is near zero (Remotive/Arbeitnow are international tech boards) | Do not depend on it. The ayush lane's dated corpus comes from the naukri keyword run plus official-notice dates in `ayushSeed.js`; live feeds are a bonus layer |
| A two-company board seed makes market signals look fake | Widen tokens in Phase 0; always print sample size and source mix beside every signal |
| "Market-adjusted score" read as manipulation | Published formula untouched; base and adjusted shown side by side with per-skill deltas; influence capped by the 0.6-1.5 clamp |
| Hash fallback presented as cryptography | `signingMode` surfaced in the UI and on every receipt |
| Five pillars, nothing finishes | Cut order: `/labs` framing → Phase 4 → Phase 3's employer side. Phases 0-2 are load-bearing and Phase 1 is the cheapest single win |

## 11. Open questions, resolved

1. **District officer persona** → served from the existing `institute` desk. No sixth role: `tests/roles.test.js:20` pins `APP_ROLES` and six files would need edits for zero judge value.
2. **Market adjustment default** → engine neutral unless a corpus is passed; the feed always passes one, with a badge and a toggle. `/match` shows both numbers.
3. **Challenge authoring** → seeded templates carry the offline demo; the employer flow ships alongside as a Should.
4. **Plan location** → this file is the canonical plan. Step 0 of implementation mirrors it into `.scratch/uniqueness-pillars/` as `PLAN.md` plus numbered `issues/NN-<slug>.md` files with `Status:` lines, per `docs/agents/issue-tracker.md`, and moves the PRD from the untracked `temp/` into that folder so it is committed with the plan.
