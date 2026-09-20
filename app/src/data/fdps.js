// ponytail: curated seeds, same shape discipline as EXTRA_JOBS. ids f1+ never collide (separate board).
import { AYUSH_ENABLED, AYUSH_FDPS } from "../ayush/seed.js"; // [ayush] rollback: delete import + if below
export const FDP_KINDS = {
  "fdp": "FDP",
  "faculty-internship": "Faculty Internship",
  "consultancy": "Consultancy",
  "workshop": "Workshop",
};

export const FDPS = [
  { id: "f1", kind: "fdp", title: "ATAL FDP: Generative AI in Teaching", org: "AICTE", loc: "Online", url: "https://www.aicte-india.org/atal", deadline: "2026-10-18" },
  { id: "f2", kind: "fdp", title: "FDP: Data Science for Engineers", org: "NPTEL / IIT Madras", loc: "Online", url: "https://nptel.ac.in/fdp", deadline: "2026-10-31" },
  { id: "f3", kind: "fdp", title: "FDP: Outcome-Based Education & NBA Filing", org: "NBA", loc: "New Delhi", url: "https://www.nbaind.org/", deadline: "2026-11-10" },
  { id: "f4", kind: "faculty-internship", title: "Summer Faculty Research Fellowship", org: "IIT Delhi", loc: "New Delhi", url: "https://home.iitd.ac.in/", deadline: "2026-11-30" },
  { id: "f5", kind: "faculty-internship", title: "Industry Immersion for Faculty", org: "Infosys Springboard", loc: "Mysuru", url: "https://www.infosys.com/springboard/", deadline: "2026-10-25" },
  { id: "f6", kind: "faculty-internship", title: "Visiting Faculty, Applied AI", org: "IIIT Hyderabad", loc: "Hyderabad", url: "https://www.iiit.ac.in/", deadline: "2026-12-01" },
  { id: "f7", kind: "consultancy", title: "AI Curriculum Design Consultancy", org: "TCS iON", loc: "Remote", url: "https://www.tcsion.com/", deadline: "2026-10-20" },
  { id: "f8", kind: "consultancy", title: "NBA Accreditation Mentorship", org: "Tier-2 Colleges Network", loc: "Pan India", url: "https://www.nbaind.org/", deadline: "2026-11-15" },
  { id: "f9", kind: "consultancy", title: "EdTech Content Review, Data Track", org: "upGrad", loc: "Remote", url: "https://www.upgrad.com/", deadline: "2026-10-28" },
  { id: "f10", kind: "workshop", title: "Hands-on LLM Workshop for Educators", org: "FOSS United", loc: "Bengaluru", url: "https://fossunited.org/", deadline: "2026-10-12" },
  { id: "f11", kind: "workshop", title: "Research Paper Writing Workshop", org: "IEEE India", loc: "Chennai", url: "https://www.ieee.org/", deadline: "2026-11-05" },
  { id: "f12", kind: "workshop", title: "Lab Modernization Bootcamp", org: "AICTE IDEA Lab", loc: "Pune", url: "https://www.aicte-india.org/", deadline: "2026-11-20" },
];

// [ayush] rollback: delete this block + ayush/seed.js
if (AYUSH_ENABLED) FDPS.push(...AYUSH_FDPS);
