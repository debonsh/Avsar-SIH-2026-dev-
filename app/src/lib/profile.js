// profile: 5-Q interview → structured profile → job/course queries + profile.md export.
// ponytail: localStorage is the db, md download is the file. No backend, no auth.
import { loadJSON, saveJSON } from "./storage.js";

const KEY = "c2c-profile-v1";

export const PROFILE_QS = [
  { id: "track", q: "Which track are you aiming for?", opts: ["sde", "data", "marketing", "govt"] },
  { id: "skills", q: "Top 2 skills you already have? (comma separated)", free: true, ph: "e.g. html, css" },
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

// ponytail: the md file IS the handoff — download it, paste to AI, or feed the scraper script
export function toMarkdown(p = {}) {
  const skills = String(p.skills || "").trim() || "—";
  return [
    `# C2C Profile`,
    ``,
    `- track: ${p.track || "—"}`,
    `- has skills: ${skills}`,
    `- goal: ${p.goal || "—"}`,
    `- location: ${p.loc || "—"}`,
    `- hours/week: ${p.hours || "—"}`,
    `- updated: ${p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : "—"}`,
    ``,
    `## Scrape queries`,
    ...queriesFromProfile(p).map((q) => `- ${q}`),
    ``,
  ].join("\n");
}

// profile → search strings the job fetcher + scrape script consume
export function queriesFromProfile(p = {}) {
  const skills = String(p.skills || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2);
  const out = [...skills];
  if (p.track && p.track !== "govt") out.push(p.track === "sde" ? "developer" : p.track);
  return [...new Set(out)].slice(0, 3);
}

// profile → fetch params: search term + remote-only flag
export function queryFromProfile(p = {}, fallbackRole = "sde") {
  const qs = queriesFromProfile(p);
  return {
    search: qs[0] || fallbackRole,
    remote: (p.loc || "anywhere") !== "india",
  };
}
