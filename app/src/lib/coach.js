// ponytail: prompt builders + offline canned answers. AI upgrades via askCoach, never gates.
import { coursesFor } from "../data/courses.js";

export const COACH_ACTIONS = [
  { id: "gaps", label: "Explain my gaps" },
  { id: "bullets", label: "Improve my bullets" },
  { id: "interview", label: "Interview tip for my role" },
  { id: "career", label: "What career fits me?" },
];

function ctx(s = {}) {
  const missing = (s.missing || []).slice(0, 3);
  const found = (s.found || []).slice(0, 12);
  return { ...s, missing, found, top: missing[0] || "" };
}

export function buildPrompt(actionId, s = {}) {
  const c = ctx(s);
  const head = `You are a placement coach for a Tier-2/3 Indian college student targeting "${c.roleLabel || "a tech role"}". Current ATS: ${c.score ?? 0}/95. Skills ON their resume: ${c.found.join(", ") || "none listed yet"}. Top missing skills: ${c.missing.join(", ") || "none"}. Best-fit track: ${c.bestFitLabel || c.roleLabel || "undecided"}.`;
  switch (actionId) {
    case "gaps":
      return `${head}\n\nExplain their gaps in 3 short bullets: why each skill blocks interviews, and the one free resource to start with. Under 120 words.`;
    case "bullets":
      return `${head}\n\nResume excerpt:\n"""\n${(c.resumeText || "").slice(0, 1200)}\n"""\n\nRewrite their 2 weakest lines as STAR bullets (25 words max each, 1 number each). Under 150 words.`;
    case "interview":
      return `${head}\n\nGive one interview tip for a "${c.roleLabel || "fresher"}" interview: a STAR template plus the single most common fresher mistake. Under 100 words.`;
    case "career":
      return `${head}\n\nShould they stay on this track or switch? One verdict plus 2 reasons grounded in their score and fit. Under 100 words.`;
    case "ask":
      return `${head}\n\nResume excerpt:\n"""\n${(c.resumeText || "").slice(0, 800)}\n"""\n\nStudent question: ${(s.question || "").slice(0, 500)}\n\nAnswer directly using their resume and skills above, under 120 words.`;
    default:
      return head;
  }
}

export function localAnswer(actionId, s = {}) {
  const c = ctx(s);
  if (actionId === "gaps") {
    if (!c.score) return "Score your resume first (My Score: paste, score) — then I'll rank your gaps by open-job demand and point each one to a free course.";
    if (!c.top) return `No gaps detected at ATS ${c.score} — job-ready on paper. Next lift: quiz best plus quest proof pushes MAIN past 65 for Gold.`;
    const course = coursesFor(c.top)[0];
    return `Your #1 gap is ${c.top} — it shows up in the most open ${c.roleLabel || ""} roles. Start here: ${course.t} (${course.u}). Close it with one project plus a proof link, re-score, and watch ATS move. Rest of the list: ${c.missing.slice(1).join(", ") || "none"}.`;
  }
  if (actionId === "bullets") {
    return `STAR bullets that clear ATS: Situation plus Task in 5 words, Action with a strong verb, Result with 1 number. Template for ${c.roleLabel || "your role"}: "Built ${c.top || "a key"} feature for N users, cutting load time by X%." Hunt your real numbers — users, marks, tests written — paste them in, re-score.`;
  }
  if (actionId === "interview") {
    return `${c.roleLabel || "Fresher"} interviews grade STAR plus numbers: open with the Result, keep each answer under 3 sentences, name one tool the role expects (${c.top || "your top gap"}). Biggest fresher mistake: "I guess / maybe" — replace with what you measured. Warm up in the Interview tab: 5 questions, STAR-graded.`;
  }
  if (actionId === "career") {
    const fit = c.bestFitLabel || c.roleLabel || "your current track";
    const stay = !c.bestFitLabel || c.bestFitLabel === c.roleLabel;
    return `Best fit right now: ${fit} at ATS ${c.score ?? 0}. ${stay ? "Stay the course — your skills already point here." : `Your lines lean ${fit} — score this same resume on that track before switching.`} Cheapest test either way: one weekend project in ${c.top || "your top gap"}.`;
  }
  return "Free-text needs the AI key (add VITE_GROQ_KEY to app/.env) — meanwhile the 4 quick actions above all work offline.";
}
