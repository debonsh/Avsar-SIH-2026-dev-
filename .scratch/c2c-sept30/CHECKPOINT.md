# Checkpoint — after Slice H (12 Sep 2026)

## Status
- Tests: 47/47 green (`node --test` in `app/`). Build green. Lint: only 2 pre-existing App.jsx warnings.
- Done: A (role shell), B (industry posting + live feed), C (quiz + MAIN), D (faculty board), E (institute dashboard), F (portfolio + kudos + ?c2c=), H (AI coach drawer).
- Portal stubs: none left (industry/faculty/institute all live).

## Remaining
- Slice I leftovers (fold into G, small): nickname editor (portfolio) + nickname on battle board "You" row. C2C ID, stamping, ?c2c= link, kudos already shipped in B/F.
- Slice G: Landing hero rewrite (funnel Analyze→Upskill→Showcase→Match + pitch line + live counters), header subtitle → "Academia–Industry Collaboration Portal", empty-states/mobile pass, offline sanity, SQL export file. PPT + demo video are human tasks.

## Key seams (for next session)
- MAIN: `combineScores` (`lib/scores.js`) over `calculateMainScore`/`rankFor` (`lib/score.js`). Jobs gate on MAIN.
- Sampling: `pickForId`/`hashStr` (`lib/quests.js`). Guards: `isEvidenceUrl` (`lib/quests.js`).
- Board IO: `lib/store.js` (null/false = seeds showing). Profile: `lib/identity.js`. Coach: `lib/coach.js` + `askCoach` (`lib/gemini.js`).
- Views: `components/` (Quiz/Faculty/Institute/Portfolio/AICoach/IndustryPost). Single App.jsx shell, NAV triples `[key,label,Icon]`.
- No new deps ever. Offline-first: try remote → catch seeds.
