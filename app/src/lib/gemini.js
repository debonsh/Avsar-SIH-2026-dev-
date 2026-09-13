// ponytail: task prompts + JSON validator live here; transport lives in ai.js
// (Groq-first, multi-model, free). Scores never come from an LLM —
// models propose questions and feedback, rubrics dispose points.
import { chat, memoCall } from "./ai.js";
import { scoreATS, extractProjectLines } from "./ats.js";

// free chat — coach drawer, floating tips
export async function ask(prompt) {
  return memoCall("coach", prompt, () => chat(prompt, "coach"));
}

// --- AI question generation: models propose, rubric disposes ---
// Strict JSON contract; anything else → null → caller falls back to the bank.
// Shape: [{ text, dimension }] — dimension tags the rubric line the Q probes.
export function parseQuestionSet(raw) {
  try {
    if (!raw || typeof raw !== "string") return null;
    const clean = raw.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(clean);
    if (!Array.isArray(arr)) return null;
    const out = [];
    for (const it of arr) {
      const text = String((it && it.text) || "").trim();
      if (!text) continue;
      out.push({ text, dimension: String((it && it.dimension) || "general").trim().slice(0, 24) });
      if (out.length >= 8) break;
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

// ponytail: models get project lines + one score line (~1k chars of signal),
// not the raw 3k dump — better probes, fewer tokens.
const QGEN_CTX = (role, resumeText) => {
  let score = "";
  try {
    const r = scoreATS(resumeText, role);
    score = `ATS ${r.total}/95; missing: ${r.missing.slice(0, 5).join(", ") || "none"}`;
  } catch { /* score stays empty, lines still work */ }
  const lines = extractProjectLines(resumeText);
  return `Role: ${role}\n${score}\nStrongest resume lines:\n${lines || "(no project lines found)"}`;
};

const QGEN_PROMPT = (kind, role, resumeText) => `You write screening questions for a Tier-2/3 Indian college student.
${QGEN_CTX(role, resumeText)}
Write ${kind === "interview" ? 5 : 4} ${kind === "interview" ? "interview" : "questionnaire"} questions PERSONALIZED to these lines: probe their actual projects, gaps, and claims. Mix: 2 project deep-dives, ${kind === "interview" ? "2 role-knowledge, 1 behavioral" : "1 role-knowledge, 1 goals"}.
Return ONLY a JSON array, no prose, no fences: [{"text": "...", "dimension": "action|result|skill|knowledge|goal"}].`;

// resume-hash cache lives in questionnaire.js; this fn is pure network+parse.
export async function generateQuestions(resumeText, role, kind = "questionnaire") {
  const raw = await chat(QGEN_PROMPT(kind, role, resumeText), kind === "interview" ? "interview" : "questions");
  return parseQuestionSet(raw);
}

export async function improveResume(resumeText, role, missing, scoreLine = "") {
  // quests/2: structured output with strong action-verb + number framing for T2/T3 students
  const prompt = `You are rewriting bullets for a Tier-2/3 Indian college student targeting "${role}". Their current ATS score: ${scoreLine}.

Resume (truncated to 2500 chars):
"""
${resumeText.slice(0, 2500)}
"""

Missing skills they should add evidence for: ${missing.join(", ") || "none"}.

Return exactly this markdown (no extra prose):

### Top 3 bullet rewrites
Pick 3 weakest lines from the resume. For each, output:

**Before:** <their exact words>
**After:** <one stronger bullet, ≤ 25 words, STAR-shaped, with 1 quantified number>
**Why:** <one short sentence>

### Numbers you should add now
3 concrete numbers the student can hunt for (e.g. "users served", "tests written", "%time saved").

### Project that closes the biggest gap in 1 weekend
One project idea, 1 line scope + the metric it should produce.

Voice: encouraging, specific, no fluff. Total under 180 words.`;
  return memoCall("rewrite", `${role}|${scoreLine}|${missing.join(",")}|${resumeText.slice(0, 1500)}`, () => chat(prompt, "rewrite"));
}

export async function mockInterviewFeedback(role, qa) {
  // quests/2: explicit STAR check, specific praise + fixes, scoring rubric visible
  const prompt = `You are grading a mock interview for a Tier-2/3 Indian student targeting "${role}".

Transcript:
"""
${qa}
"""

Score each of these 5 dimensions out of 2:
- STAR structure (Situation/Task/Action/Result present)
- Quantified impact (any number in the answer)
- Role-fit (keywords + tools the role expects)
- Concision (≤ 3 sentences each)
- Confidence language (no "I guess", "maybe", "I don't know")

Return exactly this markdown (no extra prose):

### Score: X / 10
<one-line summary>

### Strengths
- <specific line + why it works>

### Fixes
- <which Q and what to add (rephrase 1 fragment to show)>

### 60-second drill
<one task they can do today to lift score by 2>`;
  return memoCall("feedback", `${role}|${qa}`, () => chat(prompt, "feedback"));
}
