// ponytail: rubric bank first, AI customs on top. Answers persist per role and
// compile to ATS evidence — the questionnaire is a scoring input, not a form.
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { QUESTIONNAIRE } from "../data/questionnaire";
import { visibleQuestions, loadQAnswers, saveQAnswers, loadCachedSet, saveCachedSet } from "../lib/questionnaire";
import { generateQuestions } from "../lib/gemini";
import { Button, Card, CardHead, Field, inputCls } from "./ui";
import { FadeUp } from "./amicro";

export default function QuestionnaireView({ role, resumeText, onSaved }) {
  const bank = QUESTIONNAIRE[role] || QUESTIONNAIRE.sde;
  const [answers, setAnswers] = useState(() => loadQAnswers(role));
  const [aiQs, setAiQs] = useState(null);
  const [loading, setLoading] = useState(false);
  const visible = visibleQuestions(bank, answers);

  function set(id, v) {
    const next = { ...answers, [id]: v };
    for (const q of bank) {
      if (q.showIf && next[q.showIf.id] !== q.showIf.value) delete next[q.id];
    }
    setAnswers(next);
    saveQAnswers(role, next);
    onSaved?.();
  }

  async function personalize() {
    if (loading || !(resumeText || "").trim()) return;
    setLoading(true);
    try {
      const cached = loadCachedSet(resumeText, role, "questionnaire");
      const items = cached || await generateQuestions(resumeText, role, "questionnaire");
      if (items?.length) {
        if (!cached) saveCachedSet(resumeText, role, "questionnaire", items);
        setAiQs(items);
      }
    } finally {
      setLoading(false);
    }
  }

  function inputFor(q) {
    const id = q.id;
    if (q.type === "choice") {
      return (
        <div className="flex gap-2 flex-wrap">
          {q.options.map((o) => (
            <button key={o} onClick={() => set(id, o)}
              className={`text-xs font-medium px-3 py-2 rounded-lg border cursor-pointer ${answers[id] === o ? "bg-white text-zinc-950 border-white" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}>{o}</button>
          ))}
        </div>
      );
    }
    if (q.type === "yesno") {
      return (
        <div className="flex gap-2">
          {["yes", "no"].map((o) => (
            <button key={o} onClick={() => set(id, o)}
              className={`text-xs font-medium px-4 py-2 rounded-lg border capitalize cursor-pointer ${answers[id] === o ? "bg-white text-zinc-950 border-white" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}>{o}</button>
          ))}
        </div>
      );
    }
    return (
      <input value={answers[id] || ""} onChange={(e) => set(id, e.target.value)}
        placeholder={q.type === "url" ? "https://…" : "Your answer…"} className={inputCls} />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <FadeUp>
        <h1 className="text-2xl font-bold tracking-tight">About you</h1>
        <p className="text-sm text-zinc-500 mt-1">Answers feed your score as evidence — verified links beat claims.</p>
      </FadeUp>
      <FadeUp delay={0.06} className="mt-4">
        <Card>
          <CardHead title="Profile questions" desc={`${visible.length} questions · saved automatically`} />
          <div className="p-4 space-y-3">
            {visible.map((q) => (
              <Field key={q.id} label={q.text}>{inputFor(q)}</Field>
            ))}
            {aiQs?.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-2">Written for your resume</p>
                {aiQs.map((q, i) => (
                  <Field key={`ai-${i}`} label={q.text}>
                    <input value={answers[`ai-${i}`] || ""} onChange={(e) => set(`ai-${i}`, e.target.value)}
                      placeholder="Your answer…" className={inputCls} />
                  </Field>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={personalize} disabled={loading || !(resumeText || "").trim()}
                title={(resumeText || "").trim() ? "Generate questions from your resume (needs key)" : "Paste your resume on the Score tab first"}>
                <Sparkles size={14} /> {loading ? "Writing…" : aiQs ? "Regenerate" : "Ask about my resume"}
              </Button>
            </div>
            {!(import.meta.env?.VITE_GROQ_KEY || import.meta.env?.VITE_GEMINI_KEY) && (
              <p className="text-[11px] text-zinc-600">Resume-specific questions need VITE_GROQ_KEY — the bank above works offline.</p>
            )}
          </div>
        </Card>
      </FadeUp>
    </div>
  );
}
