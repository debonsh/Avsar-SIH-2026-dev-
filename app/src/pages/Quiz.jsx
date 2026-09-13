import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Chip, Empty } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { QUIZ, gradeSet, quizSample, loadQuizBest, saveQuizBest, todayDay } from "../data/quiz.js";
import { getOrCreateC2CId } from "../lib/identity.js";
import { ROLES } from "../lib/score.js";

export default function Quiz() {
  const { role } = useC2C();
  const [started, setStarted] = useState(false);
  const [picks, setPicks] = useState([]);
  const [done, setDone] = useState(null);

  const bank = QUIZ[role] || [];
  const questions = useMemo(
    () => (started ? quizSample(role, getOrCreateC2CId(), todayDay(), 10) : []),
    [started, role]
  );
  const best = loadQuizBest(role);

  function submit() {
    const g = gradeSet(questions, picks);
    saveQuizBest(role, g.score);
    setDone(g);
  }

  return (
    <Page
      title="Quiz"
      sub={`${ROLES[role]?.label || role}: 10 questions sampled for you today. Best score counts toward your rank.`}
      actions={best > 0 && <Chip tone="green">Best: {best}/100</Chip>}
    >
      {bank.length === 0 && (
        <Empty title="No quiz bank for this track yet" body="Switch to a track with a question bank from the Resume page." />
      )}

      {bank.length > 0 && !started && (
        <Card>
          <H2>Ready when you are</H2>
          <p className="text-sm text-zinc-600">10 questions, one try per sitting, instant grading with the right answers shown after.</p>
          <Btn className="mt-4" onClick={() => { setStarted(true); setPicks([]); setDone(null); }}>Start the quiz</Btn>
        </Card>
      )}

      {started && !done && (
        <Card>
          <ol className="space-y-5">
            {questions.map((q, qi) => (
              <li key={qi}>
                <p className="text-sm font-medium text-zinc-900">{qi + 1}. {q.q}</p>
                <div className="mt-2 grid gap-1.5">
                  {q.opts.map((o, oi) => (
                    <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${picks[qi] === oi ? "border-green-600 bg-green-50" : "border-zinc-200 hover:border-zinc-400"}`}>
                      <input type="radio" name={`q${qi}`} className="accent-green-700" checked={picks[qi] === oi} onChange={() => setPicks((p) => { const n = [...p]; n[qi] = oi; return n; })} />
                      {o}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <Btn className="mt-5" onClick={submit} disabled={picks.length < questions.length || picks.some((p) => p == null)}>
            Submit answers
          </Btn>
          {picks.some((p) => p == null) && <p className="mt-2 text-xs text-zinc-500">Answer every question to submit.</p>}
        </Card>
      )}

      {done && (
        <Card>
          <H2>Result: {done.score}/100 ({done.correct}/{done.total} correct)</H2>
          <p className="text-sm text-zinc-600">Best for this track: {loadQuizBest(role)}/100. Quiz strength feeds your skill mastery on the Quests page.</p>
          <ol className="mt-4 space-y-3">
            {questions.map((q, qi) => (
              <li key={qi} className="text-sm">
                <p className="font-medium text-zinc-900">{qi + 1}. {q.q}</p>
                <p className={picks[qi] === q.ans ? "text-green-800" : "text-red-700"}>
                  You: {q.opts[picks[qi]]} {picks[qi] === q.ans ? "(correct)" : `(correct answer: ${q.opts[q.ans]})`}
                </p>
              </li>
            ))}
          </ol>
          <Btn variant="quiet" className="mt-4" onClick={() => { setStarted(false); setDone(null); }}>Back</Btn>
        </Card>
      )}
    </Page>
  );
}
