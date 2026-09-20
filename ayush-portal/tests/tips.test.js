// node --test: Analyzer-style tips + video recs. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { videosFor, resumeTips } from "../src/data/courses.js";

test("videosFor returns only YouTube links already in the catalog", () => {
  const v = videosFor("panchakarma");
  assert.ok(v.length >= 1);
  assert.ok(v.every((c) => /youtube/.test(c.u)));
  assert.ok(videosFor("gmp").length <= 2);
});

test("resumeTips fires one tip per failing dimension, caps at 4", () => {
  const r = {
    total: 40,
    breakdown: [
      { label: "Skills Match", why: ["skills capped at 10 by proof volume"] },
      { label: "Format & Contact", why: ["no contact line — add email/phone"] },
    ],
  };
  const tips = resumeTips(r);
  assert.ok(tips.some((t) => /proof volume/.test(t)));
  assert.ok(tips.some((t) => /Contact block/.test(t)));
  assert.ok(tips.some((t) => /Foundation stage/.test(t)));
  assert.ok(tips.length <= 4);
  assert.deepEqual(resumeTips({}), []);
});
