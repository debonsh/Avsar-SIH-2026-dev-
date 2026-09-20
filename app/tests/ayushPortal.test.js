// node --test: ayush portal fixtures. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AYUSH_RESUMES } from "../src/ayush/resumes.js";
import { AYUSH_COLLEGES, AYUSH_NOTICES, AYUSH_PROGRAMS, ayushStats, AYUSH_SCHEMES, AYUSH_FAQ } from "../src/ayush/data.js";
import { AYUSH_JOBS } from "../src/ayush/seed.js";
import { scoreResume } from "../src/lib/score.js";

test("resume fixtures look like real biodata and score without crashing", () => {
  assert.ok(AYUSH_RESUMES.length >= 4, "need a spread of candidates");
  for (const r of AYUSH_RESUMES) {
    assert.ok(/@/.test(r.text), `${r.id} needs contact`);
    assert.ok(/BAMS/i.test(r.text), `${r.id} needs education`);
    assert.ok(/SKILLS/i.test(r.text), `${r.id} needs skills block`);
    const s = scoreResume(r.text, "ayush");
    assert.ok(s.total >= 0 && s.total <= 95, `${r.id} scores in range`);
    assert.ok(Array.isArray(s.missing), `${r.id} names gaps`);
  }
});

test("fixtures span weak to strong (checker has range)", () => {
  const totals = AYUSH_RESUMES.map((r) => scoreResume(r.text, "ayush").total);
  assert.ok(Math.max(...totals) - Math.min(...totals) >= 20, `spread too narrow: ${totals.join(",")}`);
});

test("ayush jobs carry finder fields", () => {
  assert.ok(AYUSH_JOBS.length >= 10, "job finder needs depth");
  for (const j of AYUSH_JOBS) {
    assert.equal(j.role, "ayush");
    assert.ok(j.title && j.company && j.apply, `job ${j.id} needs title/company/apply`);
    assert.ok(Array.isArray(j.skills) && j.skills.length > 0, `job ${j.id} needs skills`);
  }
  assert.ok(AYUSH_JOBS.some((j) => j.kind === "research"), "needs research postings");
  assert.ok(AYUSH_JOBS.some((j) => j.type === "Internship"), "needs internships");
});

test("portal data shapes hold", () => {
  assert.ok(AYUSH_COLLEGES.length >= 10);
  for (const c of AYUSH_COLLEGES) {
    assert.ok(c.name && c.city && c.seats > 0 && c.url, `college ${c.id} complete`);
  }
  assert.ok(AYUSH_NOTICES.every((n) => n.tag && n.text && n.url));
  assert.ok(AYUSH_PROGRAMS.every((p) => p.title && p.org && p.url));
  assert.equal(ayushStats(AYUSH_JOBS).length, 4);
});

test("schemes + faq are student-readable", () => {
  assert.ok(AYUSH_SCHEMES.length >= 4);
  for (const s of AYUSH_SCHEMES) {
    assert.ok(s.t && s.d && s.who && s.url && s.hi, `scheme ${s.id} complete`);
  }
  assert.ok(AYUSH_FAQ.length >= 5);
  for (const f of AYUSH_FAQ) {
    assert.ok(f.q.endsWith("?") && f.a.length > 20, "faq needs real answers");
  }
});
