// ponytail: works with zero keys (local mode), Gemini enriches in Part 2.
// genAI is dynamically imported — offline/local runs never download it.

const MODEL = "gemini-1.5-flash";

async function httpAdapter(prompt, key) {
  const k = key ?? import.meta.env?.VITE_GEMINI_KEY;
  if (!k) return null;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const gen = new GoogleGenerativeAI(k);
    const model = gen.getGenerativeModel({ model: MODEL });
    return model.generateContent(prompt).then((out) => out.response.text());
  } catch {
    return null;
  }
}

function localAdapter() {
  return null;
}

// ponytail: key injectable so node --test can pass one without import.meta.env
export async function ask(prompt, key) {
  return (await httpAdapter(prompt, key)) ?? localAdapter() ?? null;
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

const QGEN_PROMPT = (kind, role, resumeText) => `You write screening questions for a Tier-2/3 Indian college student targeting "${role}".
Resume:
"""
${String(resumeText || "").slice(0, 3000)}
"""
Write ${kind === "interview" ? 5 : 4} ${kind === "interview" ? "interview" : "questionnaire"} questions PERSONALIZED to this resume: probe their actual projects, gaps, and claims. Mix: 2 project deep-dives, ${kind === "interview" ? "2 role-knowledge, 1 behavioral" : "1 role-knowledge, 1 goals"}.
Return ONLY a JSON array, no prose, no fences: [{"text": "...", "dimension": "action|result|skill|knowledge|goal"}].`;

// resume-hash cache lives in questionnaire.js; this fn is pure network+parse.
export async function generateQuestions(resumeText, role, kind = "questionnaire", key) {
  const raw = await ask(QGEN_PROMPT(kind, role, resumeText), key);
  return parseQuestionSet(raw);
}

export async function improveResume(resumeText, role, missing, scoreLine = "") {
  // quests/2: structured output with strong action-verb + number framing for T2/T3 students
  const prompt = `You are rewriting bullets for a Tier-2/3 Indian college student targeting "${role}". Their current ATS score: ${scoreLine}.

Resume (truncated to 3500 chars):
"""
${resumeText.slice(0, 3500)}
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
  return ask(prompt);
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
  return ask(prompt);
}
