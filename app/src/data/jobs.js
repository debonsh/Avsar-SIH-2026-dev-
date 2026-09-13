// ponytail: curated jobs beat live scraping, never fails on stage
export const JOBS = [
  { id: 1, role: "sde", title: "Frontend Intern", company: "ZetaPay (Startup)", loc: "Remote", type: "Internship", skills: ["javascript", "react", "html", "css", "git"], minScore: 40, apply: "https://internshala.com/internships/front-end-development-internship/" },
  { id: 2, role: "sde", title: "Backend Trainee", company: "TCS Ninja (Off-campus)", loc: "Pan India", type: "Full-time", skills: ["python", "sql", "api", "git", "dsa"], minScore: 55, apply: "https://www.naukri.com/it-jobs" },
  { id: 3, role: "sde", title: "Full-Stack Junior", company: "Freshworks", loc: "Chennai", type: "Full-time", skills: ["javascript", "react", "node", "sql", "api"], minScore: 70, apply: "https://www.linkedin.com/jobs/search/?keywords=junior%20full%20stack" },
  { id: 4, role: "data", title: "Data Analyst Intern", company: "Swiggy Analytics", loc: "Bangalore", type: "Internship", skills: ["python", "sql", "excel", "visualization"], minScore: 40, apply: "https://internshala.com/internships/data-analytics-internship/" },
  { id: 5, role: "data", title: "BI Associate", company: "Flipkart", loc: "Bangalore", type: "Full-time", skills: ["sql", "tableau", "excel", "statistics", "power bi"], minScore: 65, apply: "https://www.naukri.com/data-analyst-jobs" },
  { id: 6, role: "data", title: "Reporting Analyst", company: "HDFC Bank", loc: "Mumbai", type: "Full-time", skills: ["excel", "sql", "report", "statistics"], minScore: 55, apply: "https://www.linkedin.com/jobs/search/?keywords=data%20analyst" },
  { id: 7, role: "marketing", title: "Content Intern", company: "boAt", loc: "Remote", type: "Internship", skills: ["content", "social media", "copywriting", "canva"], minScore: 35, apply: "https://internshala.com/internships/content-writing-internship/" },
  { id: 8, role: "marketing", title: "SEO Executive", company: "Zerodha", loc: "Bangalore", type: "Full-time", skills: ["seo", "analytics", "content", "ads"], minScore: 60, apply: "https://www.naukri.com/seo-jobs" },
  { id: 9, role: "govt", title: "SSC CGL Assistant", company: "Govt. of India", loc: "Pan India", type: "Govt", skills: ["gk", "reasoning", "quant", "english"], minScore: 30, apply: "https://ssc.gov.in/" },
  { id: 10, role: "govt", title: "IBPS Clerk", company: "Public Sector Banks", loc: "Pan India", type: "Govt", skills: ["reasoning", "quant", "english", "current affairs"], minScore: 30, apply: "https://www.ibps.in/" },
  { id: 11, role: "govt", title: "UPSC CSE (Foundation)", company: "Govt. of India", loc: "Delhi", type: "Govt", skills: ["polity", "history", "current affairs", "gk"], minScore: 30, apply: "https://upsc.gov.in/" },
  { id: 12, role: "sde", title: "Apprentice (NATS)", company: "Govt. Apprenticeship", loc: "Pan India", type: "Govt", skills: ["python", "sql", "git"], minScore: 35, apply: "https://nats.education.gov.in/" },
];

export function matchJobs(role, score, foundSkills = [], jobs = JOBS) {
  const found = new Set(foundSkills.map((s) => s.toLowerCase()));
  return jobs.filter((j) => j.role === role)
    .map((j) => ({
      ...j,
      matched: j.skills.filter((s) => found.has(s.toLowerCase())).length,
      eligible: score >= j.minScore,
    }))
    .sort((a, b) => (b.eligible - a.eligible) || (b.matched - a.matched));
}
