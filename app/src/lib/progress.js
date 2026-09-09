// progress layer: localStorage-backed quest completions + interview streak
// single source of truth for Part 2 gamification
import { QUEST_TREE } from "../data/quests";

const KEY = "c2c-progress-v1";

function emptyState() {
  return {
    quests: {},          // key: `${role}:${skillId}:${"course"|"project"}` = true
    streak: { lastDay: null, count: 0, badges: [] }, // ISO day, day count, badges earned
    interview: {},       // key: `${role}:${dayISO}` = count of Qs answered
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota, ignore */ }
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getProgress() { return load(); }

export function isCourseDone(roleKey, skillId) {
  return Boolean(load().quests[`${roleKey}:${skillId}:course`]);
}

export function isProjectDone(roleKey, skillId) {
  return Boolean(load().quests[`${roleKey}:${skillId}:project`]);
}

export function isSkillComplete(roleKey, skillId) {
  const s = load();
  return Boolean(s.quests[`${roleKey}:${skillId}:course`]) &&
         Boolean(s.quests[`${roleKey}:${skillId}:project`]);
}

export function setQuestDone(roleKey, skillId, kind, done) {
  const s = load();
  const k = `${roleKey}:${skillId}:${kind}`;
  if (done) s.quests[k] = true;
  else delete s.quests[k];
  save(s);
}

export function branchProgress(roleKey, branch) {
  const total = branch.skills.length * 2;
  let done = 0;
  for (const sk of branch.skills) {
    if (load().quests[`${roleKey}:${sk.id}:course`]) done++;
    if (load().quests[`${roleKey}:${sk.id}:project`]) done++;
  }
  return { done, total };
}

// mock-interview streak: call AFTER grading; bumps streak if lastDay === yesterday, else resets to 1
export function bumpStreak() {
  const s = load();
  const t = todayISO();
  const y = yesterdayISO();
  if (s.streak.lastDay === t) return s.streak;          // already counted today
  if (s.streak.lastDay === y) s.streak.count += 1;      // continued
  else s.streak.count = 1;                              // broke or first time
  s.streak.lastDay = t;
  if (s.streak.count >= 5 && !s.streak.badges.includes("interview-ready")) {
    s.streak.badges.push("interview-ready");
  }
  if (s.streak.count >= 10 && !s.streak.badges.includes("sharp")) {
    s.streak.badges.push("sharp");
  }
  save(s);
  return s.streak;
}

export function getStreak() { return load().streak; }

// returns the set of skill names (lowercased) that have course+project completed for the given role
// App.jsx merges these into `result.found` so the next resume re-score sees them as known skills
export function completedSkillIdsForRole(roleKey) {
  const tree = QUEST_TREE[roleKey];
  if (!tree) return [];
  const s = load();
  const ids = [];
  const seen = new Set();
  for (const br of tree.branches) {
    for (const sk of br.skills) {
      const c = s.quests[`${roleKey}:${sk.id}:course`];
      const p = s.quests[`${roleKey}:${sk.id}:project`];
      if (c && p && sk.name) {
        const key = sk.name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); ids.push(key); }
      }
    }
  }
  return ids;
}

export function clearProgress() {
  save(emptyState());
}
