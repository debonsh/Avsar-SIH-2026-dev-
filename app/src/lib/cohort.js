// ponytail: demo cohort + stats, one home. MAIN reuses combineScores — single formula everywhere.
import { combineScores } from "./scores.js";
import { rankFor } from "./score.js";

export const COHORT = [
  { name: "Aarav Mehta", role: "sde", ats: 78, quiz: 85, quests: 4, gaps: ["react", "node"], applied: true },
  { name: "Diya Sharma", role: "sde", ats: 62, quiz: 70, quests: 2, gaps: ["dsa", "react"], applied: true },
  { name: "Arjun Patel", role: "sde", ats: 45, quiz: 0, quests: 1, gaps: ["react", "dsa", "node"], applied: false },
  { name: "Sneha Iyer", role: "sde", ats: 88, quiz: 92, quests: 5, gaps: ["typescript"], applied: true },
  { name: "Rohan Verma", role: "sde", ats: 35, quiz: 40, quests: 0, gaps: ["git", "dsa"], applied: false },
  { name: "Ishita Rao", role: "sde", ats: 55, quiz: 60, quests: 3, gaps: ["node", "api"], applied: true },
  { name: "Priya Nair", role: "data", ats: 74, quiz: 80, quests: 3, gaps: ["sql", "tableau"], applied: true },
  { name: "Kabir Singh", role: "data", ats: 58, quiz: 45, quests: 1, gaps: ["python", "pandas"], applied: false },
  { name: "Ananya Das", role: "data", ats: 82, quiz: 90, quests: 4, gaps: ["statistics"], applied: true },
  { name: "Vikram Reddy", role: "data", ats: 40, quiz: 0, quests: 0, gaps: ["excel", "sql"], applied: false },
  { name: "Meera Joshi", role: "data", ats: 66, quiz: 72, quests: 2, gaps: ["power bi", "sql"], applied: true },
  { name: "Aditya Kulkarni", role: "data", ats: 50, quiz: 55, quests: 1, gaps: ["visualization", "report"], applied: false },
  { name: "Sara Khan", role: "marketing", ats: 70, quiz: 75, quests: 3, gaps: ["seo", "analytics"], applied: true },
  { name: "Neil Malhotra", role: "marketing", ats: 48, quiz: 50, quests: 1, gaps: ["content", "copywriting"], applied: false },
  { name: "Pooja Bhatt", role: "marketing", ats: 80, quiz: 85, quests: 4, gaps: ["ads"], applied: true },
  { name: "Karan Ahuja", role: "marketing", ats: 38, quiz: 0, quests: 0, gaps: ["seo", "social media"], applied: false },
  { name: "Riya Kapoor", role: "marketing", ats: 64, quiz: 68, quests: 2, gaps: ["email", "brand"], applied: true },
  { name: "Dev Shah", role: "marketing", ats: 52, quiz: 45, quests: 1, gaps: ["canva", "content"], applied: false },
  { name: "Aman Yadav", role: "govt", ats: 68, quiz: 72, quests: 2, gaps: ["current affairs", "polity"], applied: true },
  { name: "Shalini Gupta", role: "govt", ats: 75, quiz: 80, quests: 3, gaps: ["reasoning"], applied: true },
  { name: "Rahul Maurya", role: "govt", ats: 42, quiz: 0, quests: 1, gaps: ["quant", "gk"], applied: false },
  { name: "Deepika Rani", role: "govt", ats: 60, quiz: 65, quests: 2, gaps: ["english", "current affairs"], applied: true },
  { name: "Suresh Kumar", role: "govt", ats: 36, quiz: 30, quests: 0, gaps: ["polity", "quant", "reasoning"], applied: false },
  { name: "Fatima Sheikh", role: "govt", ats: 58, quiz: 60, quests: 1, gaps: ["gk", "english"], applied: false },
];

export function mainOf(s) {
  return combineScores(s.ats, s.quiz, s.quests, s.role).main;
}

export function enrich(rows) {
  return rows.map((s) => {
    const main = mainOf(s);
    return { ...s, main, rank: rankFor(main) };
  });
}

export function cohortStats(students) {
  const rows = enrich(students);
  const byRole = {};
  for (const r of rows) (byRole[r.role] ??= []).push(r.main);
  const avgByRole = {};
  for (const [k, v] of Object.entries(byRole)) avgByRole[k] = Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  const gold = rows.filter((r) => r.main >= 65).length;
  const gaps = {};
  for (const r of rows) for (const g of r.gaps || []) gaps[g] = (gaps[g] || 0) + 1;
  const topGaps = Object.entries(gaps)
    .map(([skill, n]) => ({ skill, n }))
    .sort((a, b) => b.n - a.n || (a.skill < b.skill ? -1 : 1))
    .slice(0, 5);
  return {
    total: rows.length,
    avgByRole,
    goldPct: rows.length ? Math.round((gold / rows.length) * 100) : 0,
    topGaps,
    funnel: {
      scored: rows.filter((r) => r.ats > 0).length,
      quiz: rows.filter((r) => r.quiz > 0).length,
      gold,
      applied: rows.filter((r) => r.applied).length,
    },
  };
}

const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

export function toCSV(rows) {
  const lines = rows.map((r) =>
    [r.name, r.role, r.ats, r.quiz, r.quests, r.main, r.rank, r.applied ? "Yes" : "No"].map(q).join(",")
  );
  return ["name,role,ats,quiz,quests,main,rank,applied", ...lines].join("\n");
}
