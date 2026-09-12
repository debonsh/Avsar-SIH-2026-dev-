// node --test: coach prompts embed live state, offline answers stay useful. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COACH_ACTIONS, buildPrompt, localAnswer } from "../src/lib/coach.js";
import { coursesFor } from "../src/data/courses.js";

const S = {
  roleLabel: "Software Developer",
  score: 52,
  missing: ["react", "node", "dsa"],
  bestFitLabel: "Software Developer",
  resumeText: "Built a todo app with HTML and CSS.",
};

test("COACH_ACTIONS: the 4 quick actions", () => {
  assert.deepEqual(COACH_ACTIONS.map((a) => a.id), ["gaps", "bullets", "interview", "career"]);
});

test("buildPrompt: every action embeds live state", () => {
  for (const a of COACH_ACTIONS) {
    const p = buildPrompt(a.id, S);
    assert.ok(p.includes("Software Developer"), `${a.id} names the role`);
    assert.ok(p.includes("52"), `${a.id} names the score`);
  }
  assert.ok(buildPrompt("gaps", S).includes("react"), "gaps names the top missing skill");
  assert.ok(buildPrompt("career", S).includes("Software Developer"), "career names the best fit");
  assert.ok(
    buildPrompt("ask", { ...S, question: "What is STAR?" }).includes("What is STAR?"),
    "free text carries the question"
  );
});

test("buildPrompt: unknown action never throws", () => {
  assert.equal(typeof buildPrompt("nope", S), "string");
});

test("localAnswer gaps: names top gap + a real free course, handles empty", () => {
  const a = localAnswer("gaps", S);
  assert.ok(a.includes("react"), "names the top gap");
  assert.ok(a.includes(coursesFor("react")[0].t), "links the top free course");
  assert.ok(localAnswer("gaps", { ...S, missing: [] }).length > 20, "empty gaps still answers");
  assert.ok(localAnswer("gaps", { ...S, score: 0 }).length > 20, "no score still answers");
});

test("localAnswer: interview has STAR + role, career has fit, bullets has STAR", () => {
  assert.ok(localAnswer("interview", S).includes("STAR"), "interview teaches STAR");
  assert.ok(localAnswer("interview", S).includes("Software Developer"), "interview names the role");
  assert.ok(localAnswer("career", S).includes("Software Developer"), "career names the fit");
  assert.ok(localAnswer("bullets", S).includes("STAR"), "bullets teaches STAR bullets");
});
