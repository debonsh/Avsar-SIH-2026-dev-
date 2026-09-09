// ponytail: works with zero keys (local mode), Gemini enriches in Part 2
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-1.5-flash";

function httpAdapter(prompt) {
  const key = import.meta.env.VITE_GEMINI_KEY;
  if (!key) return null;
  try {
    const gen = new GoogleGenerativeAI(key);
    const model = gen.getGenerativeModel({ model: MODEL });
    return model.generateContent(prompt).then((out) => out.response.text());
  } catch {
    return null;
  }
}

function localAdapter() {
  return null;
}

export async function ask(prompt) {
  return (await httpAdapter(prompt)) ?? null;
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

// exposed for tests
export const adapters = { httpAdapter, localAdapter };
