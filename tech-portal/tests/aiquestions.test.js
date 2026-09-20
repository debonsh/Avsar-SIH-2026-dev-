// node --test: AI question-set validator. Models are untrusted input —
// shape-checked here, bank fallback on any failure. No network in these tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuestionSet } from "../src/lib/gemini.js";

test("valid JSON array normalizes to text + dimension", () => {
  const r = parseQuestionSet('[{"text": "What did you ship?", "dimension": "action"}, {"text": "Users?", "dimension": "result"}]');
  assert.deepEqual(r, [
    { text: "What did you ship?", dimension: "action" },
    { text: "Users?", dimension: "result" },
  ]);
});

test("markdown fences are stripped", () => {
  const r = parseQuestionSet('```json\n[{"text": "Q?", "dimension": "star"}]\n```');
  assert.deepEqual(r, [{ text: "Q?", dimension: "star" }]);
});

test("garbage returns null (caller falls back to bank)", () => {
  assert.equal(parseQuestionSet("sorry, no questions"), null);
  assert.equal(parseQuestionSet(""), null);
  assert.equal(parseQuestionSet(null), null);
});

test("items without text are dropped, empty set is null", () => {
  assert.equal(parseQuestionSet('[{"dimension": "x"}]'), null);
  assert.equal(parseQuestionSet('[{"text": "  "}]'), null);
});

test("caps at 8, trims whitespace", () => {
  const many = JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ text: `  Q${i}? `, dimension: "d" })));
  const r = parseQuestionSet(many);
  assert.equal(r.length, 8);
  assert.equal(r[0].text, "Q0?");
});
