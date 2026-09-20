// skill-tree for the single BAMS track: classroom → clinic → career.
// "meaningful" = pair-gated (course AND project both required), skill completion feeds back into ATS.
import { AYUSH_TREE } from "../ayush/seed.js";

const UPSKILL_BRANCHES = [
  {
    id: "rotatory",
    name: "Rotatory Internship",
    skills: [
      { id: "shishiksha", name: "SHISHIKSHA Orientation", course: { t: "Bench-to-Bedside 6-day Module (NCISM)", u: "https://ncismindia.org/" }, project: "Orientation checklist: NABH, ethics, documentation, HIMS — all 6 days signed" },
      { id: "elogbook", name: "E-Logbook Discipline", course: { t: "ABDM Digital Health Basics", u: "https://abdm.gov.in/" }, project: "Digital logbook: 15 cases entered in a spreadsheet template" },
      { id: "caselog", name: "Case Presentation", course: { t: "NCISM Competency Modules", u: "https://ncismindia.org/" }, project: "Present 3 OPD cases to your unit head, log feedback" },
    ],
  },
  {
    id: "career",
    name: "First Job Ready",
    skills: [
      { id: "resume", name: "Vaidya Resume", course: { t: "SHISHIKSHA Case-Sheet Module (NCISM)", u: "https://ncismindia.org/" }, project: "Add 3 quantified clinical outcomes to your resume, re-score above 60" },
      { id: "apply", name: "First 5 Applications", course: { t: "Ayush internship listings", u: "https://internshala.com/internships/ayurveda-internship/" }, project: "Apply to 5 ayush internships, track response rate in a sheet" },
      { id: "pharmacovig", name: "Pharmacovigilance Proof", course: { t: "PvPI ADR Reporting Basics", u: "https://www.ipc.gov.in/" }, project: "File 1 mock ADR report in PvPI format, link it as proof" },
    ],
  },
];

export const QUEST_TREE = {
  ayush: {
    label: "Ayush Professional",
    branches: [...AYUSH_TREE.ayush.branches, ...UPSKILL_BRANCHES],
  },
};

export function questFor(roleKey) {
  return QUEST_TREE[roleKey] || QUEST_TREE.ayush;
}
