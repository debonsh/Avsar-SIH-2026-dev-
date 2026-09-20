import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Chip, Empty, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { QUESTIONNAIRE } from "../data/questionnaire.js";
import { visibleQuestions, compileEvidence, loadQAnswers, saveQAnswers } from "../lib/questionnaire.js";
import { scoreAnswer, skillReadiness } from "../lib/interview.js";
import { isVoiceSupported, listenOnce } from "../lib/speech.js";
import { saveJSON } from "../lib/storage.js";
import { ROLES } from "../lib/score.js";
import { AYUSH_INTERVIEW_QS } from "../data/ayushSeed.js";

const STAR_QS = [
  "Tell me about a project you built end to end.",
  "Describe a bug or problem that took real effort to fix.",
  "Tell me about a time you had to learn something fast.",
  "Describe working with someone difficult or a tight deadline.",
  "Why should we hire you for this track?",
];

export default function Interview() {
  const { role, resume } = useC2C();
  const [answers, setAnswers] = useState(() => loadQAnswers(role));
  const [qa, setQa] = useState(["", "", "", "", ""]);
  const [graded, setGraded] = useState(null);
  const [listening, setListening] = useState(-1);

  const visible = useMemo(() => visibleQuestions(QUESTIONNAIRE[role] || QUESTIONNAIRE.sde || [], answers), [role, answers]);
  const evidence = useMemo(() => compileEvidence(answers), [answers]);
  const isAyush = role === "ayush";

  function setAns(id, v) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      saveQAnswers(role, next);
      return next;
    });
  }

  function grade() {
    const scores = qa.map((t) => scoreAnswer(t));
    const ready = skillReadiness(scores);
    setGraded({ scores, ready });
    const best = Math.round(ready.avg * 25);
    saveJSON("c2c-interview-best", best);
  }

  async function dictate(i) {
    if (!isVoiceSupported()) return;
    setListening(i);
    try {
      const text = await listenOnce();
      setQa((prev) => { const n = [...prev]; n[i] = (n[i] ? n[i] + " " : "") + text; return n; });
    } catch {
      // user stopped or timed out, typed text stands
    }
    setListening(-1);
  }

  return (
    <Page title="Interview" sub="Prove your experience first, then practice STAR answers with instant grading.">
      <Card>
        <H2>Evidence questionnaire ({ROLES[role]?.label || role})</H2>
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((q) => (
            <Field key={q.id} label={q.text}>
              {q.type === "choice" && (
                <select className={inputCls} value={answers[q.id] || ""} onChange={(e) => setAns(q.id, e.target.value)}>
                  <option value="">Choose</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {q.type === "yesno" && (
                <select className={inputCls} value={answers[q.id] || ""} onChange={(e) => setAns(q.id, e.target.value)}>
                  <option value="">Choose</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              )}
              {(q.type === "text" || q.type === "url") && (
                <input className={inputCls} value={answers[q.id] || ""} onChange={(e) => setAns(q.id, e.target.value)} placeholder={q.type === "url" ? "https://" : "Your answer"} />
              )}
            </Field>
          ))}
        </div>
        {(evidence.claims.length > 0 || evidence.linkedProjects.length > 0 || evidence.level) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {evidence.level && <Chip tone="blue">{evidence.level}</Chip>}
            {evidence.claims.map((c) => <Chip key={c} tone="green">{c}</Chip>)}
            {evidence.linkedProjects.map((u) => (
              <a key={u} className="text-xs font-medium text-blurple-soft underline" href={u} target="_blank" rel="noreferrer">proof link</a>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <H2>STAR practice: 5 questions, graded instantly</H2>
        {STAR_QS.map((q, i) => (
          <div key={i} className="mb-4">
            <Field label={`${i + 1}. ${q}`}>
              <textarea
                className={`${inputCls} min-h-20 text-sm`}
                value={qa[i]}
                onChange={(e) => setQa((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                placeholder="Situation, task, action, result. Include one number."
              />
            </Field>
            <div className="mt-1.5 flex items-center gap-3">
              {isVoiceSupported() && (
                <button type="button" className="text-xs font-medium text-blurple-soft underline" onClick={() => dictate(i)} disabled={listening === i}>
                  {listening === i ? "Listening, speak now" : "Dictate instead of typing"}
                </button>
              )}
              {graded && (
                <span className="text-xs text-zinc-400">
                  STAR {graded.scores[i].micro}/4
                  {graded.scores[i].tips.length > 0 && `, fix: ${graded.scores[i].tips[0]}`}
                </span>
              )}
            </div>
          </div>
        ))}
        <Btn onClick={grade} disabled={qa.every((t) => !t.trim())}>Grade my answers</Btn>
        {graded && (
          <p className="mt-3 text-sm text-zinc-400">
            Average STAR {graded.ready.avg}/4. Weakest dimension:{" "}
            {["s", "t", "a", "r"].sort((a, b) => graded.ready[a] - graded.ready[b])[0] === "s" ? "Situation" :
             ["s", "t", "a", "r"].sort((a, b) => graded.ready[a] - graded.ready[b])[0] === "t" ? "Task" :
             ["s", "t", "a", "r"].sort((a, b) => graded.ready[a] - graded.ready[b])[0] === "a" ? "Action" : "Result"}.
            Your best average feeds the Resume score.
          </p>
        )}
      </Card>

      {!resume && (
        <div className="mt-4">
          <Empty title="Scores make practice personal" body="Answer the questionnaire and practice above without an account. Scoring a resume connects it all." action={<Btn to="/resume">Score your resume</Btn>} />
        </div>
      )}
    </Page>
  );
}