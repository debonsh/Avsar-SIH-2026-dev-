// ponytail: quiz banks are static data + 3 pure fns. Sampling reuses pickForId
// (stable per C2C ID + day), storage guarded so node --test never touches DOM.
import { pickForId } from "../lib/quests.js";
import { loadJSON, saveJSON } from "../lib/storage.js";
import { AYUSH_QUIZ } from "../ayush/seed.js";

// ponytail: 20 factual 1-line Qs; QuizView samples 10 per run.
export const QUIZ = {
  ayush: [
    ...AYUSH_QUIZ,
    { q: "Abhyanga is best described as?", opts: ["Herbal oil massage", "Nasal therapy", "Eye bath", "Bloodletting"], ans: 0 },
    { q: "Nasya administers medicine through which route?", opts: ["Oral", "Nasal", "Rectal", "Topical"], ans: 1 },
    { q: "Which text is called the 'great triad' (Brihattrayi) member on surgery?", opts: ["Charaka Samhita", "Sushruta Samhita", "Ashtanga Hridaya", "Bhavaprakasha"], ans: 1 },
    { q: "Pathya in Ayurveda means?", opts: ["Fasting", "Wholesome diet-regimen", "Surgery", "Detox only"], ans: 1 },
    { q: "Basti karma primarily balances which dosha?", opts: ["Pitta", "Kapha", "Vata", "All equally"], ans: 2 },
    { q: "Rasayana therapy aims at?", opts: ["Rejuvenation", "Purgation", "Cautery", "Amputation"], ans: 0 },
    { q: "Which ministry runs the National AYUSH Mission?", opts: ["Ministry of Health", "Ministry of Ayush", "NITI Aayog", "ICMR"], ans: 1 },
    { q: "Dinacharya refers to?", opts: ["Seasonal regimen", "Daily regimen", "Surgical tools", "Drug doses"], ans: 1 },
    { q: "Anupana means?", opts: ["Diagnosis", "Vehicle for medicine", "Pulse reading", "Diet chart"], ans: 1 },
    { q: "Agni in Ayurveda most closely maps to?", opts: ["Immunity", "Digestive/metabolic fire", "Body heat only", "Fever"], ans: 1 },
  ],
};

// ponytail: one home for grading; gradeQuiz covers the bank, gradeSet any sample.
export function gradeSet(questions = [], picks = []) {
  const total = questions.length;
  if (!total) return { score: 0, correct: 0, total: 0 };
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (picks[i] === questions[i].ans) correct++;
  }
  return { score: Math.round((correct / total) * 100), correct, total };
}

export function gradeQuiz(role, picks = []) {
  const bank = QUIZ[role];
  if (!bank) return { score: 0, correct: 0, total: 0 };
  return gradeSet(bank, picks);
}

// ponytail: deterministic 10/20 sample, stable per student per day.
// Uses pickForId per slot (no replacement) so siblings on one device differ.
export function quizSample(role, id = "", day = "", n = 10) {
  const bank = QUIZ[role] || [];
  if (!bank.length) return [];
  const pool = [...bank];
  const out = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const pick = pickForId(pool, `${id}:${day}`, `${role}:${i}`);
    out.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return out;
}

const bestKey = (role) => `c2c-quiz-${role}`;

export function loadQuizBest(role) {
  return Number(loadJSON(bestKey(role), 0)) || 0;
}

export function saveQuizBest(role, score) {
  try {
    const prev = loadQuizBest(role);
    const best = Math.max(prev, Math.round(score || 0));
    saveJSON(bestKey(role), best);
    return best;
  } catch {
    return score;
  }
}

export function todayDay() {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
}
