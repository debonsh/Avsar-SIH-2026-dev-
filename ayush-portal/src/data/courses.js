// ponytail: free links only, removes "where do I learn this?" friction
// c:true = free certificate. hrs = honest hours. kind: cert|course|practice.
// sourcing stays hand-verified (AI invents URLs); profile-driven ranking does the "smart" part offline.
export const COURSES = {
  dravyaguna: [{ t: "Ayurveda Biology: NPTEL (free cert)", u: "https://swayam.gov.in/", c: true, hrs: 20, kind: "cert" }],
  diagnosis: [{ t: "NCISM Competency Modules", u: "https://ncismindia.org/", hrs: 12 }],
  panchakarma: [{ t: "RAV CME: Panchakarma Practice", u: "https://ayush.gov.in/", hrs: 8 }, { t: "Panchakarma procedures: CCRAS video demos (free)", u: "https://www.youtube.com/results?search_query=ccras+panchakarma+procedure", hrs: 3, kind: "practice" }],
  documentation: [{ t: "SHISHIKSHA Case-Sheet Module (NCISM)", u: "https://ncismindia.org/", hrs: 4 }],
  gmp: [{ t: "SWAYAM Pharma Quality (free cert)", u: "https://swayam.gov.in/", c: true, hrs: 15, kind: "cert" }],
  pharmacovigilance: [{ t: "PvPI ADR Reporting Basics", u: "https://www.ipc.gov.in/", hrs: 4 }],
  hims: [{ t: "ABDM Digital Health Basics", u: "https://abdm.gov.in/", hrs: 6 }],
  research: [{ t: "CCRAS Research Orientation", u: "https://www.ccras.nic.in/", hrs: 10 }, { t: "Research methodology for AYUSH scholars (free)", u: "https://swayam.gov.in/", c: true, hrs: 12, kind: "cert" }],
  pharmacy: [{ t: "Bhaishajya Kalpana: SWAYAM", u: "https://swayam.gov.in/", hrs: 15 }],
  sanskrit: [{ t: "Sanskrit for Ayurveda: SWAYAM (free cert)", u: "https://swayam.gov.in/", c: true, hrs: 10, kind: "cert" }],
  shishiksha: [{ t: "Bench-to-Bedside 6-day Module (NCISM)", u: "https://ncismindia.org/", hrs: 6 }],
  anatomy: [{ t: "Rachana Sharira: NCISM modules", u: "https://ncismindia.org/", hrs: 12 }],
  physiology: [{ t: "Kriya Sharira: SWAYAM Ayurveda", u: "https://swayam.gov.in/", hrs: 12 }],
  default: [{ t: "SWAYAM Govt Certs (free cert)", u: "https://swayam.gov.in/", c: true }, { t: "NCISM Competency Modules", u: "https://ncismindia.org/" }, { t: "Ministry of Ayush learning resources", u: "https://ayush.gov.in/" }],
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

// ponytail: Analyzer-style video recs with zero new URLs — reuse hand-verified
// YouTube links already in COURSES, fall back to generic free certs otherwise.
export function videosFor(skill) {
  return coursesFor(skill).filter((c) => /youtube\.com|youtu\.be/.test(c.u)).slice(0, 2);
}

// ponytail: Analyzer "resume tips + overall score" as deterministic rules over the
// ATS breakdown. No AI, no new copy deck — each tip names the failing dimension.
export function resumeTips(result = {}) {
  const tips = [];
  const bd = Object.fromEntries((result.breakdown || []).map((b) => [b.label, b]));
  const has = (label, re) => (bd[label]?.why || []).some((w) => re.test(w));
  if (has("Skills Match", /capped at/)) tips.push("Skills capped by proof volume — add 1 case log with a link instead of more keywords.");
  if (has("Keyword Signal", /repetition capped/)) tips.push("Keyword repetition detected — cut repeats, add 1 quantified clinical outcome.");
  if (has("Project Quality", /0 quantified/)) tips.push("No numbers on your resume — add 2-3 quantified outcomes (cases, sittings, %).");
  if (has("Sections & Recency", /no dates/)) tips.push("No dates found — add years to education and postings.");
  if (has("Format & Contact", /no contact/)) tips.push("Contact block incomplete — email + phone + LinkedIn on line 1.");
  if ((result.total ?? 0) > 0 && (result.total ?? 0) < 45) tips.push("Foundation stage — 1 herbarium + 1 free cert moves this fastest.");
  return tips.slice(0, 4);
}

export const PROJECT_IDEAS = {
  ayush: [
    "20-plant herbarium with latin names + documented uses, photographed",
    "10 anonymized OPD case sheets in NCISM format, reviewed by a mentor",
    "Snehana-Swedana procedure log from 5 supervised sittings",
    "GMP gap note for the college pharmacy unit, 1 page",
    "SHISHIKSHA 6-day orientation checklist, fully signed",
    "Digital e-logbook: 15 cases entered in a spreadsheet template",
  ],
  default: [
    "20-plant herbarium with latin names + documented uses",
    "SHISHIKSHA 6-day orientation checklist, fully signed",
  ],
};
