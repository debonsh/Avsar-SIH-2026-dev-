# 01: Data spine — real dates in both lanes

**What to build:** every job posting in both lanes carries a machine-readable `postedAt` (or is explicitly flagged undated), a `lane`, and a `src`. Today the only real ISO dates the app receives are discarded, which makes every trend claim in Market Pulse unprovable.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] `src/lib/dates.js` with `parseRelativeDate`, `toIso`, `daysSince`, `isStale`; `now` always injected, unknown input returns `null` and never guesses
- [x] `tests/dates.test.js` table test with a fixed `now`
- [x] `scripts/boards.mjs`: map `postedAt` from Greenhouse `updated_at`, Ashby `publishedAt`, Lever `createdAt`
- [x] `scripts/boards.mjs`: fix `secondaryLocations` join so no posting carries `"loc": "[object Object]"` (regression: the current seed has one at `boardsSeed.js:540`)
- [x] `scripts/boards.mjs`: tag `lane: "tech"`, widen the token set from `scripts/vendor/{greenhouse,lever,ashby}.json`
- [x] `scripts/naukri.mjs`: `posted` to `postedAt` via `parseRelativeDate`, keep the raw string for display, emit salary fields, accept `--lane=ayush|tech` — landed except `--lane`: the importer tags `lane: "tech"` and there is no ayush source to point it at, so the flag would have had one reachable value.
- [ ] `scripts/vendor/ayush-queries.json`: AYUSH keyword set for the importer — **not done, and cannot be**: there is no ayush scraper in this repo for the keyword set to feed. Blocked on the scraper, not on the list.
- [x] `src/lib/store.js`: map Remotive `publication_date` and Arbeitnow `created_at` into `postedAt`, add `src`, extend `ROLE_HINTS` with ayush hints, filter by lane in `listLiveJobs`
- [ ] `src/data/ayushSeed.js`: `src` and `postedAt` on every posting from the real official notice dates — **deliberately not done** (deviation 2 above): both are derived at read time in `market.js`, which covers the curated seed without hand-editing rows and keeps working for any seed added later. The consequence is unchanged and stated: the ayush lane reports zero dated postings.
- [x] `package.json`: add the missing `boards` script (README and `boards.mjs` both document it) and a `test` script
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green

## Comments

**Status: done.** What landed:

- `src/lib/dates.js` + `tests/dates.test.js` (7 cases) — six source formats collapse to one ISO field; unreadable input returns `null`, never a guess. `isStale` is three-state on purpose: `null` means undated, and undated is not stale.
- `scripts/boards.mjs`: `postedAt` from Greenhouse `updated_at` / Ashby `publishedAt` / Lever `createdAt`; Ashby `secondaryLocations` objects are now read as `.location` (the `"[object Object]"` at `boardsSeed.js:540` is gone); `lane` derived via `laneOfRole`; a bare `npm run boards` now spreads across a `DEFAULT_TOKENS` list instead of being a usage error; **the script refuses to overwrite the seed when it keeps zero postings**, so a dead network can no longer halve the corpus.
- Seed regenerated: **49 postings from 2 companies → 216 postings from 16 companies**, all 216 dated, sources `gh: 113, lever: 25, ashby: 78` (Lever contributed for the first time). Cost: `boardsSeed.js` 48KB → 233KB, which is **+28KB gzipped** in the client bundle.
- `scripts/naukri.mjs`: `posted` resolved against the scrape's own `scraped_at`, never import time, so re-running the import later cannot silently age the corpus. Anchoring is covered by three new tests.
- `src/lib/store.js`: Remotive `publication_date` and Arbeitnow `created_at` (epoch seconds) now become `postedAt`; both live shapes carry `src` and `lane`; the live cache is stamped with its lane so an ayurveda student can never be served the cached tech result set; `ROLE_HINTS` gained narrow ayush terms; `laneOfRole` exported as the one place lane is decided.
- `Jobs.jsx`: the live feed is requested per lane and re-fetched when the lane changes (the old mount effect ran once with no lane), and the merged feed filters live rows by lane so a mixed cache cannot leak across portals.
- `package.json`: added the missing `boards` script and a `test` script.

**Deviation 1 — no ayush dates were invented.** The plan called for a dated ayush corpus from a naukri keyword run. There is no naukri scraper in this repo (the checked-in `naukriSeed.js` came from a JSON that is gone, and `SIH Scrapper/` is an unrelated project), so the ayush lane cannot gain real dates today. Rather than fabricate them, the ayush postings stay undated and Market Pulse must report `0 dated` for that lane and degrade trend to `unknown`. Staleness reads `null` (unknown), not `false` (fresh).

**Deviation 2 — no `src`/`lane` fields were written into `ayushSeed.js`.** Deriving them at read time in `market.js` (`job.src || host(job.apply)`, `laneOfRole(job.role)`) covers every curated seed without hand-editing 12 rows, and keeps working for any seed added later.

**Consequence for issue 02:** the ayush lane's market index is real (24 postings with skills, cities and stipends) but its trend comes from snapshot history, not dates. The UI must say so per lane.
