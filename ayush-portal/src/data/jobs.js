// Ayurveda-only opportunity feed: internships first, then fresher jobs.
// Same shape as before ({id, role, title, company, loc, type, skills, minScore, apply, stipend?, deadline?, kind?})
// so matchJobs, the pipeline, and eligibility keep working untouched.
export const JOBS = [
  { id: 1, role: "ayush", title: "BAMS Rotatory Intern (OPD/IPD)", company: "Govt. Ayurveda Medical College Hospital", loc: "Pan India", type: "Internship", skills: ["diagnosis", "documentation", "panchakarma"], minScore: 30, apply: "https://ncismindia.org/", stipend: "stipend as per NCISM norms", deadline: "through college internship cell" },
  { id: 2, role: "ayush", title: "Panchakarma Therapy Intern", company: "NABH Ayurveda Hospital", loc: "Kochi", type: "Internship", skills: ["panchakarma", "diagnosis", "documentation"], minScore: 35, apply: "https://internshala.com/internships/ayurveda-internship/", stipend: "₹8,000–12,000/month", deadline: "rolling" },
  { id: 3, role: "ayush", title: "Clinical Research Intern (Ayush)", company: "CCRAS Peripheral Institute", loc: "New Delhi", type: "Internship", skills: ["research", "documentation", "pharmacovigilance"], minScore: 50, apply: "https://ccras.nic.in/", stipend: "contingency + certificate", deadline: "walk-in, see CCRAS vacancies", kind: "research" },
  { id: 4, role: "ayush", title: "Herbal QA & GMP Intern", company: "ASU Drug Manufacturer", loc: "Indore", type: "Internship", skills: ["gmp", "dravyaguna", "pharmacy"], minScore: 45, apply: "https://ayush.gov.in/", stipend: "₹10,000/month", deadline: "rolling" },
  { id: 5, role: "ayush", title: "AYUSH Internship Programme 2026", company: "Ministry of Ayush", loc: "New Delhi", type: "Internship", skills: ["documentation", "research", "hims"], minScore: 35, apply: "https://ayush.gov.in/", stipend: "certificate", deadline: "30 days before joining", kind: "ministry" },
  { id: 6, role: "ayush", title: "Pharmacopoeia Lab Intern", company: "ASU Drug Testing Lab", loc: "Ghaziabad", type: "Internship", skills: ["gmp", "pharmacy", "research"], minScore: 50, apply: "https://ayush.gov.in/", stipend: "as per lab norms", deadline: "rolling" },
  { id: 7, role: "ayush", title: "OPD Vaidya (Fresher)", company: "NABH Ayurveda Hospital", loc: "Jaipur", type: "Full-time", skills: ["diagnosis", "documentation", "sanskrit"], minScore: 40, apply: "https://internshala.com/internships/ayurveda-internship/" },
  { id: 8, role: "ayush", title: "Junior Research Fellow (Ayurveda Pharmacy)", company: "NARIP Cheruthuruthy, CCRAS", loc: "Kerala", type: "Full-time", skills: ["research", "pharmacy", "documentation"], minScore: 60, apply: "https://ccras.nic.in/", stipend: "₹37,000 + HRA", deadline: "walk-in, see CCRAS vacancies", kind: "research" },
  { id: 9, role: "ayush", title: "Wellness Physician (Panchakarma Resort)", company: "Wellness Retreat Chain", loc: "Rishikesh", type: "Full-time", skills: ["panchakarma", "diagnosis", "documentation"], minScore: 40, apply: "https://ayush.gov.in/" },
  { id: 10, role: "ayush", title: "Medicinal Plants Cultivation Associate", company: "NMPB Farm Cluster", loc: "Madhya Pradesh", type: "Govt", skills: ["dravyaguna", "pharmacy", "documentation"], minScore: 30, apply: "https://www.nmpb.nic.in/" },
  { id: 11, role: "ayush", title: "SPARK UG Research Studentship", company: "CCRAS", loc: "Pan India", type: "Govt", skills: ["research", "documentation", "diagnosis"], minScore: 45, apply: "https://ccras.nic.in/", stipend: "₹50,000 scholarship", deadline: "via college guide", kind: "research" },
  { id: 12, role: "ayush", title: "Panchakarma Technician Course (65 seats)", company: "CCRAS Training Centres", loc: "Delhi / Kerala / Jammu / Guwahati", type: "Govt", skills: ["panchakarma", "diagnosis"], minScore: 25, apply: "https://ccras.nic.in/", stipend: "self-financed", deadline: "31 jul cycle", kind: "training" },
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
