// ponytail: 1 Q at a time + progress + review + retry. Sample of 10 seeded by
// C2C ID + day (stable retake same day, fresh tomorrow). Best persists per role.
import { useMemo, useState } from "react";
import { QUIZ, gradeSet, quizSample, loadQuizBest, saveQuizBest, todayDay } from "../data/quiz.js";
import { getOrCreateC2CId } from "../lib/identity.js";
import { ROLES } from "../lib/score.js";
import { Badge, Button, Card, CardHead, Progress } from "./ui";
import { FadeUp, Segmented } from "./amicro";
import { recordDay } from "../lib/progress.js";
import { track } from "../lib/analytics.js";

export default function QuizView({ role, roleOpts, onRoleChange, onDone }) {
  const day = useMemo(() => todayDay(), []);
  const id = useMemo(() => getOrCreateC2CId(), []);
  const questions = useMemo(() => quizSample(role, id, day, 10), [role, id, day]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState({});
  const [result, setResult] = useState(null);
  // ponytail: sync localStorage read per render, no memo needed; result folds in fresh score
  const best = Math.max(loadQuizBest(role), result?.score || 0);

  function pickRole(v) {
    setIdx(0); setPicks({}); setResult(null);
    onRoleChange?.(v);
  }
  function retry() {
    setIdx(0); setPicks({}); setResult(null);
  }
  function submit() {
    const arr = questions.map((_, i) => picks[i]);
    if (arr.some((a) => a == null)) return;
    const r = gradeSet(questions, arr);
    const nb = saveQuizBest(role, r.score);
    recordDay("quiz");
    track("quiz_done", { role, score: r.score });
    setResult({ ...r, best: nb, improved: r.score >= nb && r.score > 0 });
    onDone?.();
  }

  const answered = Object.keys(picks).length;
  const bank = QUIZ[role] || [];

  if (!bank.length) return null;
  const cur = questions[idx];

  return (
    <div className="max-w-2xl mx-auto">
      <FadeUp>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Skill quiz</h1>
            <p className="text-sm text-zinc-500 mt-1">10 sampled from 20 · {ROLES[role]?.label} · best score lifts your MAIN.</p>
          </div>
          {best > 0 && <Badge tone="emerald">Best {best}</Badge>}
        </div>
      </FadeUp>
      <FadeUp delay={0.05} className="mt-4">
        <div className="mb-3"><Segmented options={roleOpts} value={role} onChange={pickRole} /></div>
      </FadeUp>

      {!result ? (
        <FadeUp delay={0.08}>
          <Card>
            <CardHead title={`Q${idx + 1} of ${questions.length}`} desc={`${answered}/${questions.length} answered`} />
            <div className="p-4 space-y-3">
              <Progress value={answered} max={questions.length} />
              <p className="text-[15px] font-medium leading-relaxed">{cur.q}</p>
              <div className="space-y-2">
                {cur.opts.map((o, i) => (
                  <button key={i} onClick={() => setPicks((p) => ({ ...p, [idx]: i }))}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${picks[idx] === i ? "border-white bg-white text-zinc-950 font-medium" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}>
                    <span className="tabular-nums opacity-60 mr-2">{["A", "B", "C", "D"][i]}</span>{o}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => setIdx((v) => Math.max(0, v - 1))} disabled={idx === 0}>← Prev</Button>
                {idx < questions.length - 1
                  ? <Button variant="secondary" size="sm" onClick={() => setIdx((v) => v + 1)}>Next →</Button>
                  : <Button variant="success" size="sm" onClick={submit} disabled={answered < questions.length}>
                      Submit · {answered}/{questions.length}
                    </Button>}
              </div>
              {/* ponytail: jump rail doubles as review-before-submit, no extra component */}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} title={`Go to Q${i + 1}`}
                    className={`w-7 h-7 rounded-md text-[11px] font-bold tabular-nums border cursor-pointer ${i === idx ? "bg-white text-zinc-950 border-white" : picks[i] != null ? "border-emerald-500/40 text-emerald-400" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </FadeUp>
      ) : (
        <FadeUp delay={0.08}>
          <Card>
            <CardHead title={`Scored ${result.score}/100`} desc={`${result.correct}/${result.total} correct · best ${result.best}`}
              right={<Badge tone={result.score >= 70 ? "emerald" : result.score >= 45 ? "amber" : "zinc"}>{result.score >= 70 ? "Strong" : result.score >= 45 ? "Close" : "Foundation"}</Badge>} />
            <div className="p-4 space-y-2">
              <Progress value={result.score} />
              <p className="text-xs text-zinc-500">Best score per role persists offline and feeds MAIN. Fresh set daily — replay any day, nothing resets.</p>
              {questions.map((item, i) => {
                const ok = picks[i] === item.ans;
                return (
                  <div key={i} className={`rounded-lg border p-3 text-xs ${ok ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className="font-medium text-sm">Q{i + 1}. {item.q}</div>
                    <div className="mt-1 text-zinc-400">You: {item.opts[picks[i]]} {ok ? "✓" : `✗ → ${item.opts[item.ans]}`}</div>
                  </div>
                );
              })}
              <Button className="w-full" variant="secondary" onClick={retry}>Retry quiz</Button>
            </div>
          </Card>
        </FadeUp>
      )}
    </div>
  );
}
