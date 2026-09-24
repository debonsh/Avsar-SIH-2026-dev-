# 07: Hardening and the lane symmetry gate

**What to build:** the machine-checkable version of the both-lanes requirement, plus the README, copy and build pass that closes the feature.

**Blocked by:** 02 through 06.

**Status:** done

- [x] `tests/lanes.test.js` asserting the symmetry contract: each lane has taxonomy roles, programs covering its gap skills, seeded challenge templates, and non-empty market signals from the bundled corpus
- [x] Every new page verified for both lanes in the manual rehearsal
- [x] README section documenting the five pillars and the lane model
- [x] Copy pass on all new surfaces (no em dashes, no emoji, every button performs a real action)
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green
- [ ] `graft build` to refresh the context graph after the changes land — **not run**: graft is not installed in this environment (`command -v graft` finds nothing). Run it wherever the repo's graph tooling is available.

## Comments
**Status: done.** What landed:

- `tests/lanes.test.js` (12 cases): both lanes resolve their own roles with no role in both, every required skill is a real taxonomy skill, both lanes have programmes covering at least half their required skills, both seed offline challenges with usable rubrics, both bundle a corpus that clears the market floor, a lane's index never reads the other lane's postings, both produce a route from an empty profile with real course hours behind it, and the district refusal holds.
- README section covering the five pillars, the verification commands and the honesty conventions.
- Stale group on `/jobs` with restore, completing MP-10: stale postings are hidden by default, counted out loud, and restorable, while undated postings stay visible because unknown is not old.
- The route verifier now covers `/labs`, `/challenges` in both lanes and `/shortlist` on the industry desk.

**Two real bugs the verifier caught that no unit test could.** `CountUp` under reduced motion read its value only at mount, so when live feeds arrived and the corpus grew from 267 to 288 the market tile printed one total while the sentence under it printed another; it now derives the value during render. And `getOrCreateDeviceId` was called with `.then` although it is synchronous, which threw at render time and took the whole `/challenges` route down. Neither shows up in `node --test`, `npm run lint` or `npm run build`.
