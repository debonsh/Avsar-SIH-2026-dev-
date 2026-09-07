// ponytail: transparent keyword rubric, Gemini upgrades it in Part 2 — logic stays here
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

export function scoreResume(text = "", roleKey = "sde", earnedSkills = []) {
  const role = ROLES[roleKey] || ROLES.sde;
  const clean = text.trim();
  if (clean.length < 50) {
    return {
      total: 0, breakdown: null, found: [], missing: role.skills,
      msg: "Upload a real resume (or paste text) — too little text to score.",
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
