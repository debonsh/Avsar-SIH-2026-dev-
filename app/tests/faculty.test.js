// node --test: FDP seeds + interest store. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FDPS, FDP_KINDS } from "../src/data/fdps.js";
import { AYUSH_ENABLED, AYUSH_FDPS } from "../src/ayush/seed.js";
import { loadInterests, toggleInterest, recordInterest } from "../src/lib/store.js";

// tiny in-memory localStorage for node (guarded fns never throw without it, but persistence needs it)
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

test("FDPS: 12 base seeds + ayush module when enabled, required fields, unique ids", () => {
  const base = FDPS.filter((f) => !String(f.id).startsWith("a"));
  assert.equal(base.length, 12);
  for (const kind of Object.keys(FDP_KINDS)) {
    assert.equal(base.filter((f) => f.kind === kind).length, 3, `${kind} needs 3 seeds`);
  }
  assert.equal(FDPS.length, AYUSH_ENABLED ? 12 + AYUSH_FDPS.length : 12);
  for (const f of FDPS) {
    for (const k of ["id", "kind", "title", "org", "loc", "url", "deadline"]) {
      assert.ok(f[k], `fdp ${f.id} needs ${k}`);
    }
  }
  assert.equal(new Set(FDPS.map((f) => f.id)).size, FDPS.length, "ids unique");
});

test("interests: toggle adds then removes, persists", () => {
  assert.deepEqual(loadInterests(), []);
  assert.deepEqual(toggleInterest("f1"), ["f1"]);
  assert.deepEqual(loadInterests(), ["f1"]);
  assert.deepEqual(toggleInterest("f1"), []);
});

test("recordInterest: offline saves local, returns false (seeds already showing)", async () => {
  const ok = await recordInterest({ id: "f2", title: "T" });
  assert.equal(ok, false);
  assert.deepEqual(loadInterests(), ["f2"]);
});
