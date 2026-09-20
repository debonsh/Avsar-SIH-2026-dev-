// node --test: coach prompts embed live state, offline answers stay useful. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COACH_ACTIONS, buildPrompt, localAnswer, matchBand, matchJob, parseJobPosting, coverLetter, reviewWriteup } from "../src/lib/coach.js";
import { coursesFor } from "../src/data/courses.js";

const S = {
  roleLabel: "Software Developer",
  score: 52,
  missing: ["react", "node", "dsa"],
  bestFitLabel: "Software Developer",
  resumeText: "Built a todo app with HTML and CSS.",
};

test("COACH_ACTIONS: the 9 quick actions (5 coach + 4 JobSync tools)", () => {
  assert.deepEqual(COACH_ACTIONS.map((a) => a.id), ["gaps", "bullets", "interview", "career", "mentor", "review", "match", "cover", "addjob"]);
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

test("ask carries found skills plus resume excerpt", () => {
  const p = buildPrompt("ask", { ...S, found: ["react", "sql"], question: "my skills?" });
  assert.ok(p.includes("react"), "names a found skill");
  assert.ok(p.includes("todo app"), "carries the resume excerpt");
});

const JOB = { id: "1", title: "Frontend Intern", company: "ZetaPay", skills: ["javascript", "react", "html", "css"] };

test("matchJob bands follow JobSync thresholds", () => {
  assert.equal(matchBand(85), "strong fit");
  assert.equal(matchBand(70), "good fit");
  assert.equal(matchBand(55), "partial fit");
  assert.equal(matchBand(40), "weak fit");
  assert.equal(matchBand(10), "poor fit");
  const m = matchJob(["javascript", "react"], JOB);
  assert.equal(m.score, 50);
  assert.equal(m.band, "partial fit");
  assert.deepEqual(m.missing, ["html", "css"]);
  assert.equal(matchJob([], null), null);
});

test("reviewWriteup and coverLetter need a score, never crash", () => {
  assert.ok(reviewWriteup(S).includes("52"), "review names the score");
  assert.ok(reviewWriteup({}).includes("My Score"), "empty review redirects");
  assert.ok(coverLetter({ ...S, topJob: JOB }).includes("ZetaPay"), "letter names the company");
  assert.ok(coverLetter({}).length > 10, "empty letter still answers");
});

test("parseJobPosting extracts labeled fields, rejects scraps", () => {
  const j = parseJobPosting("PASTE:\nCompany: Acme\nTitle: Backend Intern\nLocation: Remote\nReact and node daily.");
  assert.equal(j.company, "Acme");
  assert.equal(j.title, "Backend Intern");
  assert.equal(j.loc, "Remote");
  assert.ok(j.skills.includes("react"));
  assert.equal(parseJobPosting("hi"), null);
});

