// ponytail: first-login loop math + question shaping in one pure module.
// progress is Profile 40 / Resume 30 / Interview 30; interview closes it to 100.
// interview questions are built from what the student already told us
// (skills, lane, goal, year) plus resume gaps — AI personalizes further,
// this bank is the offline floor, never a crash.
import { saveJSON } from "./storage.js";

export const ONBOARD_W = { profile: 40, resume: 30, interview: 30 };

export function onboardingProgress({ profileDone, resumeDone, interviewDone } = {}) {
  const profile = profileDone ? ONBOARD_W.profile : 0;
  const resume = resumeDone ? ONBOARD_W.resume : 0;
  const interview = interviewDone ? ONBOARD_W.interview : 0;
  return { profile, resume, interview, total: profile + resume + interview };
}

const LANE_Q = {
  clinical: "A patient walks into OPD with chronic joint pain. Walk me through your examination before you name a treatment.",
  research: "You are assisting a CCRAS trial. What goes into a case record so another researcher could trust it?",
  industry: "A batch of churnam fails a GMP check. What do you look at first, and what do you document?",
  exploring: "OPD, research, and industry all need documentation. Show me what a good one-page case note looks like.",
};

const GOAL_Q = {
  internship: "Why should a hospital pick you as an intern over a classmate with the same marks?",
  upskill: "Which one skill, if proven this month, would change your applications most — and how will you prove it?",
  certificate: "Which certificate are you chasing, and what will you be able to DO the day after you earn it?",
  portfolio: "Pick one case or project you would showcase to a hospital. Present it in four lines.",
};

function skillQ(skill, year) {
  const junior = /1st|2nd/.test(year || "");
  return junior
    ? `You listed ${skill}. Explain it like you would to a first-year junior — one definition, one example.`
    : `You listed ${skill}. Describe a real moment you used it — where, on whom or what, and what happened.`;
}

// 5 questions, always: 2 from claimed skills, 1 lane, 1 goal, 1 gap-or-year.
export function questionsFromProfile(p = {}, resume = {}) {
  const skills = String(p.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const missing = (resume?.missing || []).slice(0, 3);
  const out = [
    skillQ(skills[0] || "diagnosis", p.year),
    skills[1]
      ? skillQ(skills[1], p.year)
      : `Your resume does not show ${missing[0] || "panchakarma"} yet. What do you know about it today, honestly?`,
    LANE_Q[p.lane] || LANE_Q.exploring,
    GOAL_Q[p.goal] || GOAL_Q.internship,
    missing[0]
      ? `Employers ask for ${missing[0]} and it is missing from your resume. How would you start learning it this week?`
      : `You are ${p.year || "a BAMS student"}. What does a readiness score of 100 look like for you, in your own words?`,
  ];
  return out.slice(0, 5);
}

// test-drive reset: wipes every key the loop writes, so a fresh walkthrough
// starts at 0%. Device id and job pipeline are left alone.
const RESET_KEYS = [
  "c2c-profile-v1", "c2c-resume-v1", "c2c-interview-best", "c2c-onboarded-v1",
  "c2c-ai-memo", "c2c-q-ayush", "c2c-qgen-cache", "c2c-progress-v1",
];
export function resetOnboarding() {
  for (const k of RESET_KEYS) {
    try { saveJSON(k, null); } catch { /* private mode */ }
    try { localStorage.removeItem(k); } catch { /* node --test */ }
  }
}

// AI grade responses are free text — accept a lone 0-4 anywhere, else null.
export function parseAiGrade(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw >= 0 && raw <= 4 ? Math.round(raw) : null;
  const m = String(raw).match(/(?:^|\D)([0-4])(?:\D|$)/);
  return m ? Number(m[1]) : null;
}
