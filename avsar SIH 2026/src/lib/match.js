// Explainable matching engine — the strategy's published formula:
//   matchScore = 0.45 * skillCoverage      (fraction of required skills held)
//              + 0.25 * proficiencyFit     (how close levels are to requirement)
//              + 0.15 * verifiedRatio      (verified vs self-claimed)
//              + 0.10 * recencyOfEvidence  (skill used recently, half-life decay)
//              + 0.05 * interestAlignment  (assessment interests vs role tags)
// Same score for the student feed and the recruiter shortlist — no black box.
// Weights are exported so the "How we match" page renders the live source.
import { decayedLevel, canonSkill, demandWeight } from "../data/taxonomy.js";
import { matchBand } from "./coach.js";
import { masteryLevel } from "./progress.js";
import { proofsFor, skillConfidence, verifyState } from "../ayush/proof.js";
import { QUEST_TREE } from "../data/quests.js";
import { proofVerifiedSkills } from "./challenges.js";

export const MATCH_WEIGHTS = Object.freeze({
  coverage: 0.45,
  proficiency: 0.25,
  verified: 0.15,
  recency: 0.1,
  interest: 0.05,
});

const canon = canonSkill;
const round2 = (n) => Math.round(n * 100) / 100;
// the ladder's beginner rung: L1 Aware, L2 Trainee. A resume line is worth L2.
const BEGINNER_LEVEL = 2;

// required: [{ skill, level }] · held: [{ skill, level, verified, lastUsedAt }]
// tags: role/sector tags · interests: student's assessed interests.
// weights: optional Map<skillId, number> from the live corpus (see lib/market.js). When it
// is absent every required skill counts 1, so the output is identical to the published
// formula. When present it decides how much each required skill counts toward this posting:
// a scarce skill the market is hungry for moves the score more than a common one. The
// formula's own weights (45/25/15/10/5) never change, which is why the deck stays honest.
export function matchScore({ required = [], held = [], tags = [], interests = [], now = Date.now(), weights = null } = {}) {
  const req = (required || [])
    .map((r) => ({ skill: canon(r.skill), level: Math.max(1, Math.min(5, Number(r.level) || 3)) }))
    .filter((r) => r.skill);
  if (!req.length) {
    return { score: 0, band: matchBand(0), breakdown: { coverage: 0, proficiency: 0, verified: 0, recency: 0, interest: 0 }, matched: [], gaps: [], why: ["no required skills listed"] };
  }

  const w = (skill) => (weights ? (weights.get?.(skill) ?? weights[skill] ?? 1) : 1);
  const reqWeight = req.reduce((acc, r) => acc + w(r.skill), 0);

  const heldBy = new Map();
  for (const h of held || []) {
    const k = canon(h.skill);
    if (!k) continue;
    const prev = heldBy.get(k);
    const cur = {
      skill: k,
      level: Math.max(0, Math.min(5, Number(h.level) || 0)),
      verified: Boolean(h.verified),
      lastUsedAt: Number(h.lastUsedAt) || 0,
    };
    if (!prev || cur.level > prev.level) heldBy.set(k, cur);
  }

  const matched = [];
  const gaps = [];
  let covWeight = 0;
  let profSum = 0;
  let verifiedWeight = 0;
  let recencySum = 0;

  for (const r of req) {
    const h = heldBy.get(r.skill);
    if (!h || h.level <= 0) {
      gaps.push({ skill: r.skill, need: r.level, have: h?.level || 0 });
      continue;
    }
    const eff = decayedLevel(r.skill, h.level, h.lastUsedAt, now);
    const rw = w(r.skill);
    matched.push({
      skill: r.skill, need: r.level, have: h.level,
      verified: h.verified, effective: round2(eff),
      demand: demandWeight(r.skill),
      ...(weights ? { weight: Math.round(rw * 1000) / 1000 } : {}),
    });
    covWeight += rw;
    profSum += rw * Math.min(1, eff / r.level);
    if (h.verified) verifiedWeight += rw;
    recencySum += rw * (h.lastUsedAt ? Math.min(1, eff / h.level) : 0.5); // undated proof reads neutral
  }

  // with no weights every term below is the plain count over req.length, as published
  const denom = weights ? reqWeight : req.length;
  const coverage = denom ? covWeight / denom : 0;
  const proficiency = denom ? profSum / denom : 0;
  const verified = denom ? verifiedWeight / denom : 0;
  const recency = denom ? recencySum / denom : 0;

  const tagSet = new Set((tags || []).map(canon).filter(Boolean));
  const ints = (interests || []).map(canon).filter(Boolean);
  const interest = ints.length && tagSet.size
    ? Math.min(1, ints.filter((i) => tagSet.has(i)).length / Math.min(ints.length, tagSet.size))
    : 0;

  const parts = { coverage, proficiency, verified, recency, interest };
  const score = Math.round(
    100 * Object.entries(MATCH_WEIGHTS).reduce((acc, [k, w2]) => acc + w2 * Math.max(0, Math.min(1, parts[k])), 0)
  );

  const why = [];
  why.push(`skill coverage ${matched.length}/${req.length} → ${Math.round(coverage * 100)}%`);
  const under = matched.filter((m) => m.effective < m.need);
  if (under.length) why.push(`below target level: ${under.map((m) => `${m.skill} (L${Math.floor(m.effective)} vs L${m.need})`).join(", ")}`);
  if (gaps.length) why.push(`missing: ${gaps.map((g) => g.skill).join(", ")}`);
  if (verifiedWeight) why.push(`${matched.filter((m) => m.verified).length}/${matched.length} matched skills verified`);
  if (interest > 0) why.push("your assessed interests align with this role");
  const shifted = weights ? matched.filter((m) => m.weight !== 1).sort((a, b) => Math.abs(b.weight - 1) - Math.abs(a.weight - 1)) : [];
  if (shifted.length) why.push(`market weights applied: ${shifted.slice(0, 3).map((m) => `${m.skill} x${m.weight}`).join(", ")}`);

  return {
    score,
    band: matchBand(score),
    breakdown: parts,
    matched,
    gaps,
    why,
    ...(weights ? { market: { applied: true } } : {}),
  };
}

// fold the app's local signals into one proficiency level on the L1–L5 ladder:
// quest mastery (0–3) + strong quiz + strong proof confidence can each add a level.
export function levelFromSignals({ mastery = 0, quizBest = 0, confidence = 0 } = {}) {
  const m = Math.max(0, Math.min(3, Number(mastery) || 0));
  let l = m;
  if (Number(quizBest) >= 70) l += 1;
  if (Number(confidence) >= 70) l += 1;
  return Math.min(5, l);
}

// quest ids ≠ taxonomy ids ("pharmacovig" vs "pharmacovigilance") — bridge by name
function questIdFor(role, name) {
  const tree = QUEST_TREE[role];
  if (!tree) return null;
  const k = String(name).toLowerCase();
  for (const br of tree.branches) {
    for (const sk of br.skills) {
      if ((sk.name || "").toLowerCase() === k || sk.id === k) return sk.id;
    }
  }
  return null;
}

// one adapter every view shares: resume skills + quest/proof/quiz signals →
// the engine's held-profile shape. Verified = proof ledger or quest pair with
// evidence (same rule the portfolio uses), recency = latest proof timestamp.
export function profileForMatching(role, foundSkills = [], quizBest = 0, interests = []) {
  const skills = [];
  const verified = [];
  const levels = {};
  const usedAt = {};
  for (const raw of foundSkills || []) {
    const k = canonSkill(raw);
    if (!k || skills.includes(k)) continue;
    const mastery = masteryLevel(role, questIdFor(role, k) || k, quizBest);
    const confidence = skillConfidence(k, quizBest);
    const proofs = proofsFor(k);
    skills.push(k);
    // A skill the student actually wrote on their resume is at least L2 beginner.
    // Without this floor levelFromSignals returns 0 for a resume-only student, and
    // matchScore reads level 0 as "does not have the skill", so every posting scored
    // 0 and read as a gap. Quiz, quest and proof signals still lift it above L2.
    levels[k] = Math.max(BEGINNER_LEVEL, levelFromSignals({ mastery, quizBest, confidence }));
    if (verifyState(k, quizBest).verified || mastery >= 2) verified.push(k);
    if (proofs.length) usedAt[k] = Math.max(...proofs.map((p) => p.at || 0));
  }

  // A skill proved by a passed challenge counts in both lanes, and it counts even when the
  // resume never mentioned it, because a graded artifact is stronger evidence than a claim.
  // This rule lives here rather than at each call site: a caller that forgot it would produce
  // a quietly weaker score rather than an error, which is the kind of bug nobody notices.
  for (const raw of proofVerifiedSkills()) {
    const k = canonSkill(raw);
    if (!k) continue;
    if (!skills.includes(k)) skills.push(k);
    if (!verified.includes(k)) verified.push(k);
    levels[k] = Math.max(Number(levels[k]) || 0, BEGINNER_LEVEL, 3);
    if (!usedAt[k]) usedAt[k] = Date.now();
  }
  return { skills, levels, verified, usedAt, interests };
}

// adapter for the live feed: a job post's plain skill list → engine input.
// heldProfile: { skills: [name], levels: {name: 0-5}, verified: [name], usedAt: {name: ts}, interests: [] }
// market: optional { weights: Map, sample, lane } prepared once per corpus by lib/market.js.
// Pages pass the same Map to every card, so the index is computed once per render, not per job.
export function matchJobPost(job = null, heldProfile = {}, market = null) {
  if (!job || !(job.skills || []).length) return null;
  const required = job.skills.map((s) => ({ skill: s, level: 3 }));
  const held = (heldProfile.skills || []).map((s) => {
    const k = canon(s);
    return {
      skill: k,
      level: heldProfile.levels?.[k] ?? 2, // on the resume = at least beginner
      verified: (heldProfile.verified || []).map(canon).includes(k),
      lastUsedAt: heldProfile.usedAt?.[k] || 0,
    };
  });
  const weights = market?.weights?.size ? market.weights : null;
  const res = matchScore({ required, held, tags: job.tags || [job.role, job.kind].filter(Boolean), interests: heldProfile.interests || [], weights });
  if (!market) return res;
  return {
    ...res,
    market: {
      applied: Boolean(weights),
      sample: market.sample ?? null,
      lane: market.lane ?? null,
      at: market.at ?? null,
    },
  };
}
