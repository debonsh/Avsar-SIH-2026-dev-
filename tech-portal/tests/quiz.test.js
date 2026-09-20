// node --test: quiz banks + grading + seeded sampling. Pure, no network.
// Slice C: 20 Qs/role bank, 10 sampled per run seeded by C2C ID + day.
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUIZ, gradeQuiz, gradeSet, quizSample, loadQuizBest } from "../src/data/quiz.js";

test("banks exist for all 4 roles, 20 Qs each, 4 opts, ans in range", () => {
  for (const role of ["sde", "data", "marketing", "govt"]) {
    const bank = QUIZ[role];
    assert.equal(bank.length, 20, `${role} needs 20 Qs`);
    for (const item of bank) {
      assert.equal(typeof item.q, "string");
      assert.equal(item.opts.length, 4, `${role}: 4 opts`);
      assert.ok(item.ans >= 0 && item.ans < 4, `${role}: ans in range`);
    }
  }
});

test("gradeQuiz: full marks → 100, half → 50", () => {
  const bank = QUIZ.sde;
  const perfect = bank.map((item) => item.ans);
  assert.deepEqual(gradeQuiz("sde", perfect), { score: 100, correct: 20, total: 20 });
  const half = bank.map((item, i) => (i % 2 === 0 ? item.ans : (item.ans + 1) % 4));
  assert.deepEqual(gradeQuiz("sde", half), { score: 50, correct: 10, total: 20 });
});

test("gradeQuiz: unknown role never throws", () => {
  assert.deepEqual(gradeQuiz("nope", [0, 1]), { score: 0, correct: 0, total: 0 });
});

test("gradeSet grades a sampled subset", () => {
  const sample = QUIZ.data.slice(0, 10);
  const picks = sample.map((item) => item.ans);
  assert.deepEqual(gradeSet(sample, picks), { score: 100, correct: 10, total: 10 });
});

test("quizSample: 10/20, stable per id+day, spread across ids", () => {
  const a1 = quizSample("sde", "C2C-AAAAAA", "2026-09-30");
  const a2 = quizSample("sde", "C2C-AAAAAA", "2026-09-30");
  assert.equal(a1.length, 10);
  assert.deepEqual(a1, a2, "same id+day → same sample");
  const bankQs = new Set(QUIZ.sde.map((item) => item.q));
  for (const item of a1) assert.ok(bankQs.has(item.q), "sample is a subset of the bank");
  const seen = new Set(
    Array.from({ length: 12 }, (_, i) => quizSample("sde", `C2C-ID${i}`, "2026-09-30").map((item) => item.q).join("|"))
  );
  assert.ok(seen.size > 1, "12 ids should not all get the same sample");
});

test("loadQuizBest never throws without a browser", () => {
  assert.equal(loadQuizBest("sde"), 0);
});
