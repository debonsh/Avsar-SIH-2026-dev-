// node --test: questionnaire branching + evidence compile. Bank is fallback;
// AI customs layer on top (gemini.generateQuestions), same shape, validated.
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONNAIRE } from "../src/data/questionnaire.js";
import { visibleQuestions, compileEvidence } from "../src/lib/questionnaire.js";

test("branches hide until their condition answers", () => {
  const bank = QUESTIONNAIRE.ayush;
  const none = visibleQuestions(bank, {});
  assert.equal(none.some((q) => q.id === "logbook-count"), false);
  const yes = visibleQuestions(bank, { logbook: "yes" });
  assert.equal(yes.some((q) => q.id === "logbook-count"), true);
  const no = visibleQuestions(bank, { logbook: "no" });
  assert.equal(yes.some((q) => q.id === "logbook-count"), true);
  assert.equal(no.some((q) => q.id === "logbook-count"), false);
});

test("every role bank is non-empty with unique ids", () => {
  for (const [role, bank] of Object.entries(QUESTIONNAIRE)) {
    assert.equal(bank.length >= 4, true, `${role} needs a real bank`);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, `${role} ids unique`);
  }
});

test("evidence compiles urls, skills, level", () => {
  const ev = compileEvidence({
    "posting-url": "https://college.edu.in/intern",
    "top-skills": "Dravyaguna, Diagnosis, Panchakarma",
    level: "Intern",
  });
  assert.deepEqual(ev.linkedProjects, ["https://college.edu.in/intern"]);
  assert.deepEqual(ev.claims, ["dravyaguna", "diagnosis", "panchakarma"]);
  assert.equal(ev.level, "Intern");
});

test("empty answers compile to empty evidence, no crash", () => {
  assert.deepEqual(compileEvidence({}), { linkedProjects: [], claims: [], level: "" });
});
