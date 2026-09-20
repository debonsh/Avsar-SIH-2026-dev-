// ponytail: prompt builders + offline canned answers. AI upgrades via askCoach, never gates.
import { coursesFor } from "../data/courses.js";
import { extractSkills } from "./store.js";

export const COACH_ACTIONS = [
  { id: "gaps", label: "Explain my gaps" },
  { id: "bullets", label: "Improve my bullets" },
  { id: "interview", label: "Interview tip for my role" },
  { id: "career", label: "What career fits me?" },
  { id: "mentor", label: "Find mentorship" },
  { id: "review", label: "Review my resume" },
  { id: "match", label: "Check my fit" },
  { id: "cover", label: "Write cover letter" },
  { id: "addjob", label: "Add job from posting" },
];

function ctx(s = {}) {
  const missing = (s.missing || []).slice(0, 3);
  const found = (s.found || []).slice(0, 12);
  const job = s.topJob || null;
  return {
    ...s, missing, found, top: missing[0] || "",
    jobTitle: job?.title || "", jobCompany: job?.company || "", jobSkills: job?.skills || [],
  };
}

export function buildPrompt(actionId, s = {}) {
  const c = ctx(s);
  const head = `You are a placement coach for a Tier-2/3 Indian college student targeting "${c.roleLabel || "a tech role"}". Current resume score: ${c.score ?? 0}/95. Skills ON their resume: ${c.found.join(", ") || "none listed yet"}. Top missing skills: ${c.missing.join(", ") || "none"}. Best-fit track: ${c.bestFitLabel || c.roleLabel || "undecided"}.`;
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
    case "review":
      return `${head}\n\nResume excerpt:\n"""\n${(c.resumeText || "").slice(0, 1500)}\n"""\n\nWrite a full resume review: scores per dimension, 3 strengths, top 3 fixes with free resources. Under 200 words.`;
    case "match":
      return `${head}\n\nJob: ${c.jobTitle || "best eligible role"} at ${c.jobCompany || "a hiring company"} (needs: ${(c.jobSkills || []).join(", ") || "role skills"}).\n\nScore this resume against the job 0-100 with band (strong 80+, good 65+, partial 50+, weak 35+, poor below), then Summary, Skills overlap, Tailoring Tips. Under 200 words.`;
    case "cover":
      return `${head}\n\nJob: ${c.jobTitle || "best eligible role"} at ${c.jobCompany || "a hiring company"}.\n\nWrite a cover letter grounded ONLY in this resume (no invented numbers), first person, 3 short paragraphs, Dear Hiring Manager to Sincerely. Under 250 words.`;
    case "mentor":
      return `${head}\n\nRecommend one mentorship-style next step: a workshop topic, a guest-lecture question to ask, or a 2-week live-project brief that attacks their top gap (${c.top || "strongest missing skill"}). Concrete and beginner-sized. Under 100 words.`;
    default:
      return head;
  }
}

// --- JobSync assistant tools, offline-first ports ---

// bands copied from JobSync's job-match prompt (80+ strong, 65+ good, 50+ partial, 35+ weak)
export function matchBand(score = 0) {
  if (score >= 80) return "strong fit";
  if (score >= 65) return "good fit";
  if (score >= 50) return "partial fit";
  if (score >= 35) return "weak fit";
  return "poor fit";
}

export function matchJob(found = [], job = null) {
  if (!job || !job.skills?.length) return null;
  const have = new Set((found || []).map((s) => String(s).toLowerCase()));
  const overlap = job.skills.filter((s) => have.has(String(s).toLowerCase()));
  const score = Math.round((overlap.length / job.skills.length) * 100);
  const missing = job.skills.filter((s) => !have.has(String(s).toLowerCase()));
  return { score, band: matchBand(score), overlap, missing };
}

export function matchWriteup(found = [], job = null) {
  const m = matchJob(found, job);
  if (!m) return "Score your resume first — then I'll check its fit against your best eligible job.";
  return `Fit: ${m.score}/100 (${m.band}) — ${job.title} at ${job.company}.\nOverlap: ${m.overlap.join(", ") || "none yet"}.\nMissing: ${m.missing.join(", ") || "none — apply now"}.\nTip: close "${m.missing[0] || "nothing"}" with one quest pair and re-check fit.`;
}

export function reviewWriteup(s = {}) {
  const c = ctx(s);
  if (!c.score) return "Paste your resume in My Score first — then I'll write the full review with scores and fixes.";
  const lines = (c.breakdown || []).map((b) => `${b.label}: ${b.pts}/${b.max}`).join(" · ") || `resume score ${c.score}/95`;
  return `Resume review — resume score ${c.score}/95 (${lines}).\nStrengths: ${(c.found || []).slice(0, 3).join(", ") || "none listed yet"}.\nTop fixes: ${(c.missing || []).slice(0, 3).map((m) => `${m} (free: ${coursesFor(m)[0].t})`).join("; ") || "none — showcase-ready"}.`;
}

export function coverLetter(s = {}) {
  const c = ctx(s);
  if (!c.score) return "Score your resume first — a cover letter needs real bullets to stand on.";
  const job = c.topJob;
  const name = (c.contactName || "A C2C student").trim();
  const head = job ? `${job.title} at ${job.company}` : (c.roleLabel || "an internship");
  return `Dear Hiring Manager,\n\nI am applying for ${head}. My resume shows ${(c.found || []).slice(0, 3).join(", ") || "hands-on project work"}, and I am closing ${(c.missing || []).slice(0, 2).join(" and ") || "my remaining gaps"} through verified coursework.\n\nWhat I bring on day one: ${(c.found || []).slice(0, 2).join(", ") || "project experience"} with proof links on my portfolio. I would welcome the chance to discuss the role.\n\nSincerely,\n${name}`;
}

// JobSync add-job confirmation pattern: paste → parse → confirm card → save.
export function parseJobPosting(pasted = "") {
  const t = String(pasted || "").replace(/^PASTE:\s*/i, "").trim();
  if (t.length < 20) return null;
  const pick = (re) => (t.match(re) || [])[1]?.trim() || "";
  const company = pick(/(?:company|org|at)\s*[:-]\s*(.+)/i) || (t.match(/ at ([A-Z][\w& ]{1,40})/) || [])[1]?.trim() || "Unknown company";
  const title = pick(/(?:title|role|position)\s*[:-]\s*(.+)/i) || t.split("\n")[0].slice(0, 80);
  const location = pick(/(?:location|loc)\s*[:-]\s*(.+)/i) || (/remote/i.test(t) ? "Remote" : "Not specified");
  const type = pick(/(?:type|employment)\s*[:-]\s*(.+)/i) || (/full-?time/i.test(t) ? "Full-time" : "Internship");
  return {
    id: `pasted-${Date.now()}`,
    role: "sde",
    title,
    company,
    loc: location,
    type,
    skills: extractSkills(t),
    minScore: 0,
    apply: pick(/(?:apply|url|link)\s*[:-]\s*(https?:\/\/\S+)/i) || "#",
    description: t.slice(0, 2000),
  };
}

export function localAnswer(actionId, s = {}) {
  const c = ctx(s);
  if (actionId === "gaps") {
    if (!c.score) return "Score your resume first (My Score: paste, score) — then I'll rank your gaps by open-job demand and point each one to a free course.";
    if (!c.top) return `No gaps detected at resume score ${c.score} — job-ready on paper. Next lift: quiz best plus quest proof pushes readiness past 65 for Gold.`;
    const course = coursesFor(c.top)[0];
    return `Your #1 gap is ${c.top} — it shows up in the most open ${c.roleLabel || ""} roles. Start here: ${course.t} (${course.u}). Close it with one project plus a proof link, re-score, and watch your score move. Rest of the list: ${c.missing.slice(1).join(", ") || "none"}.`;
  }
  if (actionId === "bullets") {
    return `STAR bullets that clear screening: Situation plus Task in 5 words, Action with a strong verb, Result with 1 number. Template for ${c.roleLabel || "your role"}: "Built ${c.top || "a key"} feature for N users, cutting load time by X%." Hunt your real numbers — users, marks, tests written — paste them in, re-score.`;
  }
  if (actionId === "interview") {
    return `${c.roleLabel || "Fresher"} interviews grade STAR plus numbers: open with the Result, keep each answer under 3 sentences, name one tool the role expects (${c.top || "your top gap"}). Biggest fresher mistake: "I guess / maybe" — replace with what you measured. Warm up in the Interview tab: 5 questions, STAR-graded.`;
  }
  if (actionId === "career") {
    const fit = c.bestFitLabel || c.roleLabel || "your current track";
    const stay = !c.bestFitLabel || c.bestFitLabel === c.roleLabel;
    return `Best fit right now: ${fit} at resume score ${c.score ?? 0}. ${stay ? "Stay the course — your skills already point here." : `Your lines lean ${fit} — score this same resume on that track before switching.`} Cheapest test either way: one weekend project in ${c.top || "your top gap"}.`;
  }
  if (actionId === "review") return reviewWriteup(s);
  if (actionId === "match") return matchWriteup(c.found, c.topJob);
  if (actionId === "cover") return coverLetter(s);
  if (actionId === "mentor") {
    const gap = c.top || "your top gap";
    return `Mentorship track for ${gap}: (1) workshop — "Hands-on LLM Workshop for Educators" pattern, but for students: pick one FOSS United weekend build; (2) guest-lecture question — ask one working engineer "what broke last week and how did you find it"; (3) live project — ship one ${gap} mini-build in 2 weekends with a proof link, then re-score. Faculty board (/faculty) lists the real seats; this loop is the warm-up.`;
  }
  if (actionId === "addjob") {
    return "Paste the job posting as your next message starting with PASTE: (include Company:, Title:, Location: lines if you can). I'll parse it and show a confirm card — nothing saves until you press Confirm.";
  }
  return "Free-text needs the AI key (add VITE_GROQ_KEY to app/.env) — meanwhile the 4 quick actions above all work offline.";
}
