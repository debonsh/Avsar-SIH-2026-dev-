# 05: District Skill Thermometer — demand versus supply, no PII

**What to build:** the same corpus that drives Market Pulse drives a demand versus supply planner for placement cells, exporting only k-anonymous signed aggregates so no student record leaves the device.

**Blocked by:** 01 and 02 (same corpus), 04 (signing for the export).

**Status:** done

- [x] `src/lib/district.js`: `districtDemand`, `unmetDemand`, `capacityPlan`, `privacyAggregate`
- [x] `privacyAggregate(rows, k = 5)` returns `{ buckets, suppressed }` so suppression is visible and never silent
- [x] Never aggregate across lanes in one figure
- [x] `tests/district.test.js` covering the all-buckets-suppressed case, a tiny cohort, and a lane-mix rejection
- [x] Signed aggregate export reusing `sign.js`
- [x] `/institute`: lane switch, unmet local demand, batch recommendations, a k control defaulting to 5, an explicit insufficient cohort state, and a visible statement that zero personal records leave the device
- [x] `/faculty`: reads the same corpus for curriculum alignment
- [x] `node --test "tests/*.test.js"`, `npm run lint`, `npm run build` all green

## Comments
**Status: done.** What landed:

- `src/lib/district.js` and `tests/district.test.js` (11 cases): `districtDemand`, `unmetDemand`, `capacityPlan`, `privacyAggregate`, `DEFAULT_K`, `DEFAULT_BATCH`.
- `privacyAggregate` returns `{ buckets, suppressed, k, total, suppressedCount }`, so a withheld bucket is visible and the size of what was withheld is itself published. A withheld bucket cannot read as a zero.
- A figure that spans two lanes is refused outright with the lanes named, rather than averaged.
- `/institute` gained the thermometer: demand by city, unmet demand against the cohort's own gap list inverted into a supply figure, a batch plan, a k control, and the zero-PII statement.
- Supply is only computed for skills the cohort actually reports on. The rest are excluded and counted in the UI, because treating an unknown supply as zero would have inflated the plan.

**Honest limitation.** The sample cohort records gaps, not held skills, so supply is derived as "cohort size minus students reporting this gap". That is arithmetic on real data, and the panel says where it comes from, but it is not the same as a verified inventory.
**Closed in a second pass.** The signed export exists now: the institute panel signs its published counts, downloads them with the signature, and links to a verification page. Before this the panel's own copy claimed the export carried a signature while no such export existed, which is the exact kind of unsupported claim this build is meant to avoid. `/faculty` also reads the same corpus through a curriculum alignment panel, so a batch plan and a syllabus change cannot be argued from two different pictures of one market.
