# 06: /labs — the judge-facing page

**What to build:** a public route that frames the difference with working widgets, because uniqueness a judge cannot see in 90 seconds scores the same as uniqueness that does not exist.

**Blocked by:** 02, 03, 04 (the widgets are live demonstrations of them).

**Status:** done

- [x] Renders before onboarding completes, which needs both `"labs"` in `PUBLIC_SEGMENTS` (`rbac.js:15`) and an unguarded route in `shell.jsx:416-438`; a nav link is not possible pre-onboarding, so `Welcome.jsx` links to it
- [x] Comparison table: what every other platform does versus what Avsar does
- [x] Four live mini-widgets, each with a lane toggle so the identical machinery runs for an ayurveda student and a tech student: market recompute, route simulation, blind shortlist preview, offline receipt verification
- [x] A 60-second demo path strip listing the exact clicks
- [x] An explicit statement of which parts work with zero keys and no network
- [x] Copy rules: no em dashes, no emoji
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green

## Comments
**Status: done.** What landed:

- `src/pages/Labs.jsx`, public in two places rather than one: `"labs"` in `PUBLIC_SEGMENTS` and an unguarded route in `shell.jsx`, because a guarded route redirects to the chooser and this page exists so someone can judge the product before answering anything. `Welcome.jsx` links to it, since the nav is suppressed pre-onboarding.
- Four widgets on real modules and real bundled data, with a lane switch that runs the identical machinery on both: the market index with sample sizes and a sparkline, the route search on a stated demo profile, the live grader on two fixtures, and a receipt signed in the browser and then checked with one number changed.
- The comparison table, the ninety second path with real routes, and an explicit statement of what needs a key or a network.
