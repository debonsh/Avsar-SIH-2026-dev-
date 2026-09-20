// node --test: questionnaire branching + evidence compile. Bank is fallback;
// AI customs layer on top (gemini.generateQuestions), same shape, validated.
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONNAIRE } from "../src/data/questionnaire.js";
import { visibleQuestions, compileEvidence } from "../src/lib/questionnaire.js";

test("branches hide until their condition answers", () => {
  const bank = QUESTIONNAIRE.sde;
  const none = visibleQuestions(bank, {});
  assert.equal(none.some((q) => q.id === "live-url"), false);
  const yes = visibleQuestions(bank, { live: "yes" });
  assert.equal(yes.some((q) => q.id === "live-url"), true);
  const no = visibleQuestions(bank, { live: "no" });
  assert.equal(no.some((q) => q.id === "live-url"), false);
});

test("every role bank is non-empty with unique ids", () => {
  for (const [role, bank] of Object.entries(QUESTIONNAIRE)) {
    assert.equal(bank.length >= 4, true, `${role} needs a real bank`);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, `${role} ids unique`);
  }
});

test("evidence compiles urls, skills, level", () => {
  const ev = compileEvidence({
    "live-url": "https://mess.app.in",
    "top-skills": "React, Node, SQL",
    level: "Fresher",
  });
  assert.deepEqual(ev.linkedProjects, ["https://mess.app.in"]);
  assert.deepEqual(ev.claims, ["react", "node", "sql"]);
  assert.equal(ev.level, "Fresher");
});

test("empty answers compile to empty evidence, no crash", () => {
  assert.deepEqual(compileEvidence({}), { linkedProjects: [], claims: [], level: "" });
});
