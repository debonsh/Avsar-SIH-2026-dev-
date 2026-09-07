// ponytail: free links only — removes "where do I learn this?" friction
export const COURSES = {
  javascript: [{ t: "freeCodeCamp JS (free)", u: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" }, { t: "Namaste JS — YouTube (free)", u: "https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP" }],
  react: [{ t: "React Official Tutorial (free)", u: "https://react.dev/learn" }, { t: "NPTEL Modern Web (free cert)", u: "https://swayam.gov.in/" }],
  node: [{ t: "Node.js Crash Course (free)", u: "https://www.youtube.com/watch?v=fBNz5xF-Kx4" }],
  python: [{ t: "Python for Everybody — NPTEL (free)", u: "https://swayam.gov.in/" }, { t: "freeCodeCamp Python (free)", u: "https://www.freecodecamp.org/learn/scientific-computing-with-python/" }],
  sql: [{ t: "SQLBolt (free, 1 hr)", u: "https://sqlbolt.com/" }, { t: "Khan Academy SQL (free)", u: "https://www.khanacademy.org/computing/computer-programming/sql" }],
  git: [{ t: "Git Handbook — GitHub (free)", u: "https://guides.github.com/introduction/git-handbook/" }],
  dsa: [{ t: "Striver A2Z DSA (free)", u: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" }],
  api: [{ t: "REST APIs — freeCodeCamp (free)", u: "https://www.youtube.com/watch?v=-MTSQjw5DrM" }],
  "power bi": [{ t: "MS Power BI Guided (free)", u: "https://learn.microsoft.com/en-us/training/paths/power-bi-fundamentals/" }],
  tableau: [{ t: "Tableau Free Training", u: "https://www.tableau.com/learn/training" }],
  excel: [{ t: "Excel for Analysts — NPTEL", u: "https://swayam.gov.in/" }],
  seo: [{ t: "Ahrefs SEO Course (free)", u: "https://ahrefs.com/academy/seo-training-course" }],
  gk: [{ t: "Lucent GK + Affairs (free)", u: "https://www.ssc.gov.in/" }],
  "current affairs": [{ t: "PIB Daily (free, official)", u: "https://pib.gov.in/" }],
  reasoning: [{ t: "Reasoning — Indiabix (free)", u: "https://www.indiabix.com/" }],
  quant: [{ t: "Quant — NPTEL Aptitude", u: "https://swayam.gov.in/" }],
  default: [{ t: "SWAYAM Govt Certs (free)", u: "https://swayam.gov.in/" }, { t: "NPTEL Courses (free)", u: "https://nptel.ac.in/" }],
};

export function coursesFor(skill) {
  const k = skill.toLowerCase();
  return COURSES[k] || COURSES.default;
}

export const PROJECT_IDEAS = {
  sde: ["Todo API + React frontend, deploy on Vercel, add README with screenshots", "Clone Swiggy homepage in React + Tailwind, push to GitHub", "URL shortener with Node + SQLite, show API docs"],
  data: ["IPL dashboard in Excel/PowerBI with 3 insights + charts", "Swiggy orders CSV analysis in Python + 1-page report", "SQL project: 10 queries on e-commerce DB, publish on GitHub"],
  marketing: ["Run a 7-day meme page campaign, track reach in a sheet", "SEO audit of your college site, 2-page fix report", "Write 5 LinkedIn posts for a local shop, show engagement"],
  govt: ["30-day current-affairs notes + 10 mock tests log", "PYQ analysis sheet: last 5 yrs SSC quant topics", "Daily 50 reasoning Qs tracker for 21 days"],
};

// ponytail: roadmap reuses COURSES/JOBS urls — no new sources until judges ask
export const ROADMAP = {
  sde: [
    { sem: "Sem 6", task: "DSA basics + Git", link: { t: "Striver A2Z DSA (free)", u: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" } },
    { sem: "Sem 7", task: "React project, deploy on Vercel", link: { t: "React Official Tutorial (free)", u: "https://react.dev/learn" } },
    { sem: "Sem 8", task: "ATS 70+ → apply to internships", link: { t: "Frontend internships", u: "https://internshala.com/internships/front-end-development-internship/" } },
  ],
  data: [
    { sem: "Sem 6", task: "SQL + Excel foundations", link: { t: "SQLBolt (free, 1 hr)", u: "https://sqlbolt.com/" } },
    { sem: "Sem 7", task: "PowerBI dashboard project", link: { t: "MS Power BI Guided (free)", u: "https://learn.microsoft.com/en-us/training/paths/power-bi-fundamentals/" } },
    { sem: "Sem 8", task: "Publish 1 analysis report → apply", link: { t: "Data internships", u: "https://internshala.com/internships/data-analytics-internship/" } },
  ],
  marketing: [
    { sem: "Sem 6", task: "SEO basics + 5 sample posts", link: { t: "Ahrefs SEO Course (free)", u: "https://ahrefs.com/academy/seo-training-course" } },
    { sem: "Sem 7", task: "Run a 7-day page campaign", link: { t: "Content internships", u: "https://internshala.com/internships/content-writing-internship/" } },
    { sem: "Sem 8", task: "Portfolio of 3 campaigns → apply", link: { t: "SEO jobs", u: "https://www.naukri.com/seo-jobs" } },
  ],
  govt: [
    { sem: "Sem 6", task: "GK + daily current affairs", link: { t: "PIB Daily (free, official)", u: "https://pib.gov.in/" } },
    { sem: "Sem 7", task: "Reasoning 50 Qs/day + mocks", link: { t: "Reasoning — Indiabix (free)", u: "https://www.indiabix.com/" } },
    { sem: "Sem 8", task: "10 mocks logged → apply", link: { t: "SSC official", u: "https://ssc.gov.in/" } },
  ],
};
