// ponytail: role rubrics live here; ATS math moved to ats.js (transparent,
// anti-gaming). scoreResume keeps its signature + shape — thin caller over the engine.
import { scoreATS } from "./ats.js";
import { AYUSH_ENABLED, AYUSH_ROLE } from "../ayush/seed.js";

export const ROLES = {
  sde: {
    label: "Software Developer",
    skills: ["javascript", "react", "node", "python", "git", "sql", "dsa", "api", "html", "css"],
    keywords: ["project", "internship", "github", "developed", "deployed", "api"],
  },
  data: {
    label: "Data Analyst",
    skills: ["python", "sql", "excel", "pandas", "tableau", "power bi", "statistics", "visualization"],
    keywords: ["dashboard", "analysis", "dataset", "insights", "report", "sql"],
  },
  marketing: {
    label: "Marketing Associate",
    skills: ["seo", "content", "social media", "analytics", "email", "canva", "ads", "copywriting"],
    keywords: ["campaign", "growth", "engagement", "content", "brand", "metrics"],
  },
  govt: {
    label: "Govt Exams (SSC/UPSC/Bank)",
    skills: ["gk", "current affairs", "reasoning", "quant", "english", "polity", "history"],
    keywords: ["exam", "preparation", "mock test", "current affairs", "reasoning"],
  },
};

// [ayush] rollback: delete this block + ayush/seed.js
if (AYUSH_ENABLED) ROLES.ayush = AYUSH_ROLE;

// ponytail: MAIN_SCORE per MASTER_PRD §4.1, pure, no imports. ATS 0-95 in, all clamped.
export function calculateMainScore(atsScore = 0, voiceScore = 0, proofScore = 0, roleKey = "sde") {
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));
  const a = clamp(atsScore), v = clamp(voiceScore), p = clamp(proofScore);
  const tech = roleKey === "sde" || roleKey === "data";
  return tech ? Math.round(0.5 * a + 0.3 * v + 0.2 * p) : Math.round(0.6 * a + 0.3 * v + 0.1 * p);
}

// ponytail: rank per MASTER_PRD §4.2, single home for badge + job gating
export function rankFor(score = 0) {
  if (score >= 90) return "Diamond";
  if (score >= 80) return "Platinum";
  if (score >= 65) return "Gold";
  if (score >= 50) return "Silver";
  return "Bronze";
}

// ponytail: career-path finder, score the same text against every role, suggest the best fit
export function rankRoles(text = "", earnedSkills = []) {
  return Object.keys(ROLES)
    .map((key) => ({ key, label: ROLES[key].label, total: scoreResume(text, key, earnedSkills).total }))
    .sort((a, b) => b.total - a.total);
}

// ponytail: thin caller over ats.js — same shape, engine owns the math.
// proof = { linkedProjects: [] } from questionnaire/evidence; optional, backward compatible.
export function scoreResume(text = "", roleKey = "sde", earnedSkills = [], proof = null) {
  return scoreATS(text, roleKey, { earnedSkills, proof: proof || undefined });
}

// ponytail: stored scores predate the current shape (old builds saved nulls).
// normalize once at read time so every view is safe without its own guards.
export function normalizeScoreResult(result = null) {
  return {
    total: Number(result?.total) || 0,
    breakdown: Array.isArray(result?.breakdown) ? result.breakdown : [],
    found: Array.isArray(result?.found) ? result.found : [],
    missing: Array.isArray(result?.missing) ? result.missing : [],
  };
}

// ponytail: quest pairs → proof proxy min(100, pairs*20). Single formula everywhere.
export function questPairsToProof(pairs = 0) {
  const n = Math.max(0, Math.floor(Number(pairs) || 0));
  return Math.min(100, n * 20);
}

export function combineScores(ats = 0, quiz = 0, questPairs = 0, roleKey = "sde") {
  const main = calculateMainScore(ats, quiz, questPairsToProof(questPairs), roleKey);
  return { main, rank: rankFor(main) };
}
