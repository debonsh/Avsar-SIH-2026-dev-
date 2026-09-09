// ponytail: transparent keyword rubric, Gemini upgrades it in Part 2, logic stays here
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

function countHits(text, words) {
  const t = text.toLowerCase();
  return words.filter((w) => t.includes(w.toLowerCase()));
}

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

export function scoreResume(text = "", roleKey = "sde", earnedSkills = []) {
  const role = ROLES[roleKey] || ROLES.sde;
  const clean = text.trim();
  if (clean.length < 50) {
    return {
      total: 0, breakdown: null, found: [], missing: role.skills,
      msg: "Upload a real resume (or paste text). Too little text to score.",
    };
  }
  const foundSkills = countHits(clean, role.skills);
  const foundKw = countHits(clean, role.keywords);
  const hasSections = ["experience", "project", "education", "skills"].filter((s) =>
    clean.toLowerCase().includes(s)
  ).length;
  const hasNumbers = /\d+%|\d+\+? (users|projects|clients)|\d{4}/.test(clean);
  const hasContact = /@|linkedin|github|phone|[0-9]{10}/i.test(clean);

  // merge quest-earned skills into the found set (cap so it never breaks the metric)
  const earnedUpper = earnedSkills.slice(0, Math.max(0, role.skills.length - foundSkills.length));
  const merged = [...foundSkills, ...earnedUpper.map((s) => s.toLowerCase())];

  // 30 skills + 20 keywords + 25 sections/projects + 15 format + 10 quantified
  const skillsPts = Math.round((merged.length / role.skills.length) * 30);
  const kwPts = Math.round((foundKw.length / role.keywords.length) * 20);
  // +1 pts per completed quest-pair, capped so it can't blow past the rubric
  const questBonus = Math.min(8, earnedUpper.length * 2);
  const projPts = Math.min(25, hasSections * 6 + (clean.length > 1500 ? 4 : 0) + questBonus);
  const formatPts = (hasContact ? 8 : 0) + Math.min(7, Math.floor(clean.length / 400));
  const impactPts = hasNumbers ? 10 : 3;

  const total = Math.min(95, skillsPts + kwPts + projPts + formatPts + impactPts);
  return {
    total,
    breakdown: [
      { label: "Skills Match", pts: skillsPts, max: 30 },
      { label: "Keywords", pts: kwPts, max: 20 },
      { label: "Experience/Projects", pts: projPts, max: 25 },
      { label: "Format & Contact", pts: formatPts, max: 15 },
      { label: "Quantified Impact", pts: impactPts, max: 10 },
    ],
    found: merged,
    missing: role.skills.filter((s) => !merged.map((x) => x.toLowerCase()).includes(s.toLowerCase())),
    strengths: foundKw,
    earned: earnedSkills,
  };
}
