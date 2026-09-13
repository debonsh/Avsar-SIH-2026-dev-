// ponytail: free links only, removes "where do I learn this?" friction
// c:true = free certificate. hrs = honest hours. kind: cert|course|practice.
// sourcing stays hand-verified (AI invents URLs); profile-driven ranking does the "smart" part offline.
export const COURSES = {
  javascript: [{ t: "freeCodeCamp JS (free cert)", u: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", c: true }, { t: "Namaste JS — YouTube (free)", u: "https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP" }],
  react: [{ t: "React Official Tutorial (free)", u: "https://react.dev/learn" }, { t: "NPTEL Modern Web (free cert)", u: "https://swayam.gov.in/", c: true }],
  node: [{ t: "Node.js Crash Course (free)", u: "https://www.youtube.com/watch?v=fBNz5xF-Kx4" }],
  python: [{ t: "Python for Everybody — NPTEL (free cert)", u: "https://swayam.gov.in/", c: true, hrs: 20, kind: "cert" }, { t: "freeCodeCamp Python (free cert)", u: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", c: true, hrs: 12, kind: "cert" }],
  sql: [{ t: "SQLBolt (free, 1 hr)", u: "https://sqlbolt.com/", hrs: 1, kind: "practice" }, { t: "Khan Academy SQL (free)", u: "https://www.khanacademy.org/computing/computer-programming/sql", hrs: 6 }, { t: "HackerRank SQL (free cert)", u: "https://www.hackerrank.com/skills-verification/sql_basic", c: true, hrs: 2, kind: "cert" }],
  git: [{ t: "Git Handbook — GitHub (free)", u: "https://guides.github.com/introduction/git-handbook/" }],
  dsa: [{ t: "Striver A2Z DSA (free)", u: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" }, { t: "HackerRank Problem Solving (free cert)", u: "https://www.hackerrank.com/skills-verification/problem_solving_basic", c: true }],
  api: [{ t: "REST APIs — freeCodeCamp (free)", u: "https://www.youtube.com/watch?v=-MTSQjw5DrM" }],
  "power bi": [{ t: "MS Power BI Guided (free)", u: "https://learn.microsoft.com/en-us/training/paths/power-bi-fundamentals/" }],
  tableau: [{ t: "Tableau Free Training", u: "https://www.tableau.com/learn/training" }],
  excel: [{ t: "Excel for Analysts — NPTEL (free cert)", u: "https://swayam.gov.in/", c: true }],
  seo: [{ t: "Ahrefs SEO Course (free cert)", u: "https://ahrefs.com/academy/seo-training-course", c: true }, { t: "Google Digital Garage (free cert)", u: "https://learndigital.withgoogle.com/digitalgarage", c: true }],
  content: [{ t: "Google Digital Garage (free cert)", u: "https://learndigital.withgoogle.com/digitalgarage", c: true }],
  gk: [{ t: "Lucent GK + Affairs (free)", u: "https://www.ssc.gov.in/" }],
  "current affairs": [{ t: "PIB Daily (free, official)", u: "https://pib.gov.in/" }],
  reasoning: [{ t: "Reasoning — Indiabix (free)", u: "https://www.indiabix.com/" }],
  quant: [{ t: "Quant — NPTEL Aptitude (free cert)", u: "https://swayam.gov.in/", c: true }],
  default: [{ t: "SWAYAM Govt Certs (free cert)", u: "https://swayam.gov.in/", c: true }, { t: "NPTEL Courses (free cert)", u: "https://nptel.ac.in/", c: true }, { t: "Great Learning free certs", u: "https://www.mygreatlearning.com/academy", c: true }, { t: "AWS Educate (free cert)", u: "https://aws.amazon.com/education/awseducate/", c: true }],
};

export function coursesFor(skill) {
  const k = skill.toLowerCase();
  return COURSES[k] || COURSES.default;
}

// ponytail: certificate goal → cert links first, fall back to generic free certs
export function certsFor(skill) {
  const all = coursesFor(skill);
  const certs = all.filter((c) => c.c);
  return certs.length ? certs : COURSES.default.filter((c) => c.c);
}

const HOURS_BUDGET = { "2-4": 4, "5-8": 12, "9+": 999 };

// ponytail: the "AI-smart" ranker with no AI — goal picks the category, hours pick the size.
// goal=certificate → certs first · goal=portfolio/internship → practice first · hours → fits-week first.
// entries without hrs are assumed bite-size and never penalized.
export function recommendFor(skill, profile = {}) {
  const list = [...coursesFor(skill)];
  const budget = HOURS_BUDGET[profile.hours] ?? 999;
  const wantCert = profile.goal === "certificate";
  const wantPractice = profile.goal === "portfolio" || profile.goal === "internship";
  return list
    .map((c, i) => {
      let s = 0;
      if (wantCert && c.c) s -= 10;
      if (wantPractice && (c.kind === "practice" || /project/i.test(c.t))) s -= 10;
      if ((c.hrs ?? 2) > budget) s += 5;
      return { c, s, i };
    })
    .sort((a, b) => (a.s - b.s) || (a.i - b.i))
    .map((x) => x.c);
}

export const PROJECT_IDEAS = {
  sde: ["Todo API + React frontend, deploy on Vercel, add README with screenshots", "Clone Swiggy homepage in React + Tailwind, push to GitHub", "URL shortener with Node + SQLite, show API docs"],
  data: ["IPL dashboard in Excel/PowerBI with 3 insights + charts", "Swiggy orders CSV analysis in Python + 1-page report", "SQL project: 10 queries on e-commerce DB, publish on GitHub"],
  marketing: ["Run a 7-day meme page campaign, track reach in a sheet", "SEO audit of your college site, 2-page fix report", "Write 5 LinkedIn posts for a local shop, show engagement"],
  govt: ["30-day current-affairs notes + 10 mock tests log", "PYQ analysis sheet: last 5 yrs SSC quant topics", "Daily 50 reasoning Qs tracker for 21 days"],
};

