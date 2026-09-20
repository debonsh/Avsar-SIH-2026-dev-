// profile: 5-Q interview → structured profile → job/course queries + profile.md export.
// ponytail: localStorage is the db, md download is the file. No backend, no auth.
import { loadJSON, saveJSON } from "./storage.js";

const KEY = "c2c-profile-v1";

export const PROFILE_QS = [
  { id: "skills", q: "Top skills you already have? (comma separated)", free: true, ph: "e.g. dravyaguna, diagnosis" },
  { id: "year", q: "Which BAMS year are you in?", opts: ["1st year", "2nd year", "3rd year", "4th year", "Intern"] },
  { id: "lane", q: "Which lane pulls you most?", opts: ["clinical", "research", "industry", "exploring"] },
  { id: "college", q: "Your college? (optional, improves local matches)", free: true, ph: "e.g. Govt. Ayurveda College, Patna" },
  { id: "goal", q: "What do you want most right now?", opts: ["internship", "upskill", "certificate", "portfolio"] },
  { id: "loc", q: "Where can you work?", opts: ["remote", "india", "anywhere"] },
  { id: "hours", q: "Hours per week you can give?", opts: ["2-4", "5-8", "9+"] },
];

export function loadProfile() {
  return loadJSON(KEY, null);
}

export function saveProfile(p) {
  const v = { ...(p || {}), updatedAt: Date.now() };
  saveJSON(KEY, v);
  return v;
}

export function clearProfile() {
  saveJSON(KEY, null);
}

// ponytail: the md file IS the handoff — download it, paste to AI, or feed the scraper script.
// Carries everything the matcher and the coach need: skills, lane, year, goal.
export function toMarkdown(p = {}) {
  const skills = String(p.skills || "").trim() || "not set";
  return [
    `# Avsar Profile`,
    ``,
    `- track: ayurveda (BAMS)`,
    `- has skills: ${skills}`,
    `- bams year: ${p.year || "not set"}`,
    `- lane: ${p.lane || "not set"}`,
    `- college: ${String(p.college || "").trim() || "not set"}`,
    `- goal: ${p.goal || "not set"}`,
    `- location: ${p.loc || "not set"}`,
    `- hours/week: ${p.hours || "not set"}`,
    `- updated: ${p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : "not set"}`,
    ``,
    `## Scrape queries`,
    ...queriesFromProfile(p).map((q) => `- ${q}`),
    ``,
  ].join("\n");
}

// profile → search strings the job fetcher + scrape script consume.
// lane sharpens the third query so research/industry postings surface.
const LANE_QUERY = { clinical: "opd", research: "research", industry: "gmp" };
export function queriesFromProfile(p = {}) {
  const skills = String(p.skills || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2);
  const out = [...skills, "ayurveda"];
  if (p.lane && LANE_QUERY[p.lane]) out.push(LANE_QUERY[p.lane]);
  return [...new Set(out)].slice(0, 3);
}

// profile → fetch params: search term + remote-only flag
export function queryFromProfile(p = {}, fallbackRole = "ayush") {
  const qs = queriesFromProfile(p);
  return {
    search: qs[0] || fallbackRole,
    remote: (p.loc || "anywhere") !== "india",
  };
}
