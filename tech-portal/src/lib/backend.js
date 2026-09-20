// ponytail: one home for the JobSync + Analyzer backend mirror. Pure row-shapers
// (node --test) + local-first saves + best-effort Supabase inserts. Remote never
// blocks: false means "local already saved", callers carry on.
import { getClient } from "./supabase.js";
import { getOrCreateC2CId } from "./identity.js";
import { loadJSON, saveJSON } from "./storage.js";

// --- pure (tested) ---

export const JOB_EVENTS = ["saved", "applied", "dismissed", "interview", "offer", "rejected"];
export const ARTIFACT_KINDS = ["review", "match", "cover_letter"];
export const RESUME_SECTIONS = ["contact", "experience", "education", "skills", "certifications"];

export function isJobEvent(e) {
  return JOB_EVENTS.includes(String(e || "").toLowerCase());
}

export function isArtifactKind(k) {
  return ARTIFACT_KINDS.includes(String(k || "").toLowerCase());
}

export function normalizeSection(s) {
  const v = String(s || "").toLowerCase();
  return RESUME_SECTIONS.includes(v) ? v : null;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(n || 0)));

export function toAssessmentRow(p = {}) {
  if (p.ats == null && p.main == null) return null;
  return {
    student: p.student || "local",
    ats: clamp(p.ats, 0, 95),
    main: clamp(p.main, 0, 100),
    role_key: p.roleKey || "sde",
    gaps: Array.isArray(p.gaps) ? p.gaps.map(String).slice(0, 20) : [],
  };
}

export function toJobEventRow(p = {}) {
  if (!p.jobId || !isJobEvent(p.event)) return null;
  return { student: p.student || "local", job_id: String(p.jobId), event: String(p.event).toLowerCase() };
}

export function toArtifactRow(p = {}) {
  if (!isArtifactKind(p.kind) || !p.body) return null;
  return {
    student: p.student || "local",
    job_id: p.jobId ? String(p.jobId) : null,
    kind: String(p.kind).toLowerCase(),
    body: String(p.body).slice(0, 20000),
  };
}

export function toFeedbackRow(p = {}) {
  if (!p.comment && p.rating == null) return null;
  return {
    student: p.student || "local",
    rating: p.rating == null ? null : clamp(p.rating, 1, 5),
    comment: String(p.comment || "").slice(0, 2000),
  };
}

// dashboard funnel: counts per event, latest status per job wins
export function funnelCounts(events = []) {
  const latest = new Map();
  for (const e of events || []) {
    if (!e || !e.jobId || !isJobEvent(e.event)) continue;
    latest.set(String(e.jobId), String(e.event).toLowerCase());
  }
  const out = Object.fromEntries(JOB_EVENTS.map((k) => [k, 0]));
  for (const v of latest.values()) out[v] += 1;
  return out;
}

// --- local-first (offline-safe) ---

const AKEY = "c2c-assessments";
const EKEY = "c2c-job-events";
const RKEY = "c2c-artifacts";
const FKEY = "c2c-feedback";

export function loadAssessments() {
  return loadJSON(AKEY, []);
}

export function loadJobEvents() {
  return loadJSON(EKEY, []);
}

export function loadArtifacts() {
  return loadJSON(RKEY, []);
}

export function loadFeedback() {
  return loadJSON(FKEY, []);
}

// Analyzer admin: distribution aggregates over assessments + feedback. Pure.
export function analyticsSummary(assessments = [], feedback = []) {
  const byRole = {};
  const bands = { "0-44": 0, "45-64": 0, "65+": 0 };
  for (const a of assessments || []) {
    if (!a) continue;
    byRole[a.role_key || "sde"] = (byRole[a.role_key || "sde"] || 0) + 1;
    const ats = a.ats ?? 0;
    bands[ats >= 65 ? "65+" : ats >= 45 ? "45-64" : "0-44"] += 1;
  }
  const ratings = (feedback || []).map((f) => f.rating).filter((r) => r >= 1 && r <= 5);
  const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  const comments = (feedback || []).filter((f) => (f.comment || "").trim()).slice(0, 5);
  return { total: (assessments || []).length, byRole, bands, avgRating, ratingCount: ratings.length, comments };
}

async function insert(table, row) {
  const sb = await getClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from(table).insert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function saveAssessment(p = {}) {
  const row = toAssessmentRow({ ...p, student: getOrCreateC2CId() });
  if (!row) return false;
  saveJSON(AKEY, [row, ...loadAssessments()].slice(0, 50));
  return insert("assessments", row);
}

export async function saveResumeSections(sections = []) {
  const rows = (sections || [])
    .map((s) => ({ student: getOrCreateC2CId(), section: normalizeSection(s.section), payload: s.payload || {}, status: s.status === "skipped" ? "skipped" : "accepted" }))
    .filter((r) => r.section);
  if (!rows.length) return false;
  let ok = true;
  for (const r of rows) ok = (await insert("resume_sections", r)) && ok;
  return ok;
}

export async function recordJobEvent(jobId, event) {
  const row = toJobEventRow({ jobId, event, student: getOrCreateC2CId() });
  if (!row) return false;
  saveJSON(EKEY, [...loadJobEvents(), { jobId: row.job_id, event: row.event, at: Date.now() }].slice(-200));
  return insert("job_events", row);
}

export async function saveArtifact(p = {}) {
  const row = toArtifactRow({ ...p, student: getOrCreateC2CId() });
  if (!row) return false;
  saveJSON(RKEY, [row, ...loadArtifacts()].slice(0, 50));
  return insert("ai_artifacts", row);
}

export async function submitFeedback(p = {}) {
  const row = toFeedbackRow({ ...p, student: getOrCreateC2CId() });
  if (!row) return false;
  saveJSON(FKEY, [row, ...loadJSON(FKEY, [])].slice(0, 50));
  return insert("feedback", row);
}

async function select(table) {
  const sb = await getClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from(table).select("*").order("created_at", { ascending: false }).limit(200);
    return error ? null : data || [];
  } catch {
    return null;
  }
}

export async function loadRemoteAssessments() {
  return select("assessments");
}

export async function loadRemoteFeedback() {
  return select("feedback");
}
