// ponytail: one home for board IO. Pure mappers (node --test) + local-first writes + best-effort remote.
// Remote never blocks: null/false means "seeds already showing", callers carry on.
import { getClient } from "./supabase.js";
import { getOrCreateC2CId } from "./identity.js";
import { ROLES } from "./score.js";

// --- pure (tested) ---

export function toJobShape(r) {
  if (!r) return null;
  return {
    id: `remote-${r.id ?? r.title}`,
    role: r.role_key || "sde",
    title: r.title || "Untitled role",
    company: r.company || "Unknown",
    loc: r.location || "Remote",
    type: r.type || "Internship",
    skills: Array.isArray(r.required_skills) ? r.required_skills.map(String) : [],
    minScore: Number(r.min_score ?? 40),
    apply: r.apply_url || "#",
    description: r.description || "",
    remote: true,
  };
}

export function mergeJobs(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const j of list || []) {
      if (!j || seen.has(j.id)) continue;
      seen.add(j.id);
      out.push(j);
    }
  }
  return out;
}

// --- local-first (offline-safe) ---

const CKEY = "c2c-custom-jobs";
const AKEY = "c2c-applications";
const IKEY = "c2c-interests";

export function loadCustomJobs() {
  try {
    return JSON.parse(localStorage.getItem(CKEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveCustomJob(job) {
  const all = [job, ...loadCustomJobs()];
  try {
    localStorage.setItem(CKEY, JSON.stringify(all));
  } catch { /* quota, ignore */ }
  return all;
}

export function loadApplications() {
  try {
    return JSON.parse(localStorage.getItem(AKEY)) ?? [];
  } catch {
    return [];
  }
}

export function countLocalApplications(jobId) {
  return loadApplications().filter((a) => a.jobId === jobId).length;
}

function saveApplicationLocal(app) {
  try {
    localStorage.setItem(AKEY, JSON.stringify([...loadApplications(), app]));
  } catch { /* ignore */ }
}

// --- remote best-effort (Supabase jobs_board / applications) ---

export async function listJobsBoard() {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("jobs_board").select("*").order("created_at", { ascending: false }).limit(100);
    if (error || !data?.length) return null;
    return data.map(toJobShape).filter(Boolean);
  } catch {
    return null;
  }
}

export async function createJobBoard(p) {
  const sb = getClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from("jobs_board").insert({
      title: p.title, company: p.company, location: p.loc, type: p.type,
      role_key: p.role, required_skills: p.skills, min_score: p.minScore,
      apply_url: p.apply, description: p.description || "", created_by: getOrCreateC2CId(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function recordApplication(job, ats, main = ats) {
  const app = { jobId: job.id, title: job.title, ats: Math.round(ats || 0), at: Date.now() };
  saveApplicationLocal(app);
  const sb = getClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from("applications").insert({
      job_id: String(job.id), student: getOrCreateC2CId(), ats: app.ats, main: Math.round(main || ats || 0),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function countRemoteApplications(jobId) {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { count, error } = await sb.from("applications").select("id", { count: "exact", head: true }).eq("job_id", String(jobId));
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

// --- faculty interests (Slice D): local-first ids + best-effort interests table ---

export function loadInterests() {
  try {
    return JSON.parse(localStorage.getItem(IKEY)) ?? [];
  } catch {
    return [];
  }
}

export function toggleInterest(id) {
  const ids = loadInterests();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  try {
    localStorage.setItem(IKEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export async function recordInterest(fdp) {
  const ids = loadInterests();
  if (!ids.includes(fdp.id)) {
    try {
      localStorage.setItem(IKEY, JSON.stringify([...ids, fdp.id]));
    } catch { /* ignore */ }
  }
  const sb = getClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from("interests").insert({
      fdp_id: String(fdp.id), faculty: getOrCreateC2CId(),
    });
    return !error;
  } catch {
    return false;
  }
}

// --- portfolio (Slice F): verified ticks + kudos + shared showcase ---

export function isVerified(skill, earnedSkills = [], github = "") {
  const s = String(skill || "").toLowerCase();
  if (github) return true; // linked GitHub = proof of work behind every found skill
  return (earnedSkills || []).map((x) => String(x).toLowerCase()).includes(s);
}

const KGIVEN = "c2c-kudos-given";
const KCOUNT = "c2c-kudos-fallback";

export function hasGivenKudos(id) {
  try {
    return (JSON.parse(localStorage.getItem(KGIVEN)) ?? []).includes(id);
  } catch {
    return false;
  }
}

export function loadKudosFallback(id) {
  try {
    return (JSON.parse(localStorage.getItem(KCOUNT)) ?? {})[id] || 0;
  } catch {
    return 0;
  }
}

export async function fetchKudos(id) {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { count, error } = await sb.from("kudos").select("id", { count: "exact", head: true }).eq("c2c_id", String(id));
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

export async function giveKudos(id) {
  if (hasGivenKudos(id)) return null; // already counted — never double
  try {
    const given = JSON.parse(localStorage.getItem(KGIVEN)) ?? [];
    localStorage.setItem(KGIVEN, JSON.stringify([...given, id]));
    const counts = JSON.parse(localStorage.getItem(KCOUNT)) ?? {};
    counts[id] = (counts[id] || 0) + 1;
    localStorage.setItem(KCOUNT, JSON.stringify(counts));
  } catch { /* ignore */ }
  const sb = getClient();
  if (!sb) return null;
  try {
    const { error } = await sb.from("kudos").insert({ c2c_id: String(id) });
    return !error;
  } catch {
    return false;
  }
}

// read-only shared profile: best MAIN + application count + kudos, null when unknown/offline
export async function loadSharedShowcase(id) {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data } = await sb.from("applications").select("ats,main").eq("student", String(id)).limit(50);
    const kudos = await fetchKudos(id);
    if (!data?.length && !kudos) return null;
    const mains = (data || []).map((a) => a.main ?? a.ats ?? 0);
    return { applications: (data || []).length, bestMain: Math.max(0, ...mains), kudos: kudos ?? 0 };
  } catch {
    return null;
  }
}

// --- live jobs (free Remotive API, no key). Cached 6h, seeds survive offline. ---

const LIVE_KEY = "c2c-live-jobs";
const LIVE_TTL = 6 * 3600 * 1000;

const ROLE_HINTS = [
  ["data", ["data", "analyst", "sql", "tableau", "power bi", "scientist", "machine learning", " ai ", "ml "]],
  ["marketing", ["marketing", "seo", "content", "social", "growth", "copywrit", "brand", " ads"]],
  ["sde", ["develop", "engineer", "software", "frontend", "backend", "full-stack", "full stack", "web", "react", "node", "javascript", "python", "mobile", "devops", " qa", "qa "]],
];

// ponytail: unmapped → null → dropped. A wrong-track job in the feed is worse than a missing one.
export function guessRole(text = "") {
  const t = ` ${String(text).toLowerCase()} `;
  for (const [role, hints] of ROLE_HINTS) {
    if (hints.some((h) => t.includes(h))) return role;
  }
  return null;
}

const VOCAB = [...new Set(Object.values(ROLES).flatMap((r) => r.skills))];

export function extractSkills(text = "", vocab = VOCAB) {
  const t = ` ${String(text).toLowerCase()} `;
  const out = new Set(vocab.filter((v) => t.includes(` ${String(v).toLowerCase()} `)));
  if (t.includes("github")) out.add("git");
  return [...out].slice(0, 6);
}

export function toLiveJobShape(r, i = 0) {
  const text = `${r.title || ""} ${r.category || ""} ${r.description || ""}`;
  const role = guessRole(text);
  if (!role || !r.title) return null;
  return {
    id: `live-${r.id ?? i}`,
    role,
    title: r.title,
    company: r.company_name || "Remote co",
    loc: "Remote",
    type: /full/i.test(r.job_type || "") ? "Full-time" : "Internship",
    skills: extractSkills(text),
    minScore: 45,
    apply: r.url || "#",
    live: true,
  };
}

export function liveCacheAt() {
  try {
    return (JSON.parse(localStorage.getItem(LIVE_KEY) || "null") || {}).at || 0;
  } catch {
    return 0;
  }
}

export async function listLiveJobs(force = false) {
  const readCache = () => {
    try {
      return (JSON.parse(localStorage.getItem(LIVE_KEY) || "null") || {}).jobs || [];
    } catch {
      return [];
    }
  };
  if (!force) {
    try {
      const c = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
      if (c && Date.now() - c.at < LIVE_TTL && c.jobs?.length) return c.jobs;
    } catch { /* fall through to fetch */ }
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=20", { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error("live feed down");
    const data = await res.json();
    const jobs = (data.jobs || []).map(toLiveJobShape).filter(Boolean);
    try {
      localStorage.setItem(LIVE_KEY, JSON.stringify({ at: Date.now(), jobs }));
    } catch { /* quota, ignore */ }
    return jobs.length ? jobs : readCache();
  } catch {
    return readCache();
  }
}
