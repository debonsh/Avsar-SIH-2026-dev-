// [ayush] ai assessment: resume in → custom questions out. ai generates quiz,
// interview, and evidence items from resume lines; banks fill any gap the ai
// leaves. grading is local rubrics. best score feeds mastery like /quiz.
import { useState } from "react";
import { Page, Card, H2, Btn, Field, inputCls } from "../components/ui.jsx";
import Masthead from "./Masthead.jsx";
import { AYUSH_RESUMES } from "./resumes.js";
import { genQuizItems, genInterviewQs, genQuestionnaire } from "../lib/aiQuestions.js";
import { QUIZ, gradeSet, saveQuizBest } from "../data/quiz.js";
import { INTERVIEW_QS } from "../data/interview.js";
import { QUESTIONNAIRE } from "../data/questionnaire.js";
import { scoreAnswer } from "../lib/interview.js";
import { ayushReadout, pathForSkill } from "./scoring.js";
import { addProof, PROOF_KINDS } from "./proof.js";

function ProofLogger({ skill, onLogged }) {
  const [kind, setKind] = useState(pathForSkill(skill));
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2 border border-zinc-800 bg-zinc-950 px-3 py-2.5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        prove {skill} — no github needed
      </p>
      {done ? (
        <p className="mt-1.5 font-mono text-xs text-emerald-300">logged ✓ confidence updated below on re-grade</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-2">
          <select className={`${inputCls} w-auto`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="proof kind">
            {PROOF_KINDS.filter((k) => k.id !== "quiz").map((k) => (
              <option key={k.id} value={k.id}>{k.label} — {k.hint}</option>
            ))}
          </select>
          <input
            className={`${inputCls} min-w-[200px] flex-1`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={kind === "mentor" ? "teacher name" : kind === "case-log" ? "e.g. 12 opd cases, dr. rao" : "issuer / link / note"}
            aria-label="proof detail"
          />
          <Btn
            size="sm"
            onClick={() => {
              if (!detail.trim() && kind !== "orientation") return;
              addProof({ skill, kind, detail: detail.trim() || "orientation checklist" });
              setDone(true);
              onLogged();
            }}
          >
            [log proof]
          </Btn>
        </div>
      )}
    </div>
  );
}

export default function AyushAssess() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("idle");
  const [quiz, setQuiz] = useState([]);
  const [picks, setPicks] = useState({});
  const [ivQs, setIvQs] = useState([]);
  const [ivAns, setIvAns] = useState({});
  const [qnr, setQnr] = useState([]);
  const [qnrAns, setQnrAns] = useState({});
  const [banked, setBanked] = useState([]);
  const [graded, setGraded] = useState(null);
  const [notice, setNotice] = useState("");

  async function generate() {
    if (!text.trim()) {
      setNotice("paste your resume or clinical background first.");
      return;
    }
    setPhase("generating");
    setNotice("");
    setGraded(null);
    const [qz, iv, qn] = await Promise.all([
      genQuizItems(text, "ayush", 8).catch(() => null),
      genInterviewQs(text, "ayush").catch(() => null),
      genQuestionnaire(text, "ayush").catch(() => null),
    ]);
    const used = [];
    const qzFinal = qz || (() => { used.push("quiz bank"); return QUIZ.ayush.slice(0, 8); })();
    const ivFinal = iv || (() => { used.push("interview bank"); return INTERVIEW_QS.ayush; })();
    const qnFinal = qn || (() => { used.push("questionnaire bank"); return QUESTIONNAIRE.ayush; })();
    setQuiz(qzFinal);
    setIvQs(ivFinal);
    setQnr(qnFinal);
    setBanked(used);
    setPicks({});
    setIvAns({});
    setQnrAns({});
    setPhase("answering");
  }

  function grade() {
    const g = gradeSet(quiz, quiz.map((_, i) => picks[i]));
    const ivScores = ivQs.map((_, i) => scoreAnswer(ivAns[i] || ""));
    const ivAvg = ivScores.length ? ivScores.reduce((a, s) => a + s.micro, 0) / ivScores.length : 0;
    saveQuizBest("ayush", g.score);
    setGraded({ quiz: g, ivAvg, readout: ayushReadout(text) });
    setPhase("graded");
  }

  function refreshReadout() {
    setGraded((prev) => (prev ? { ...prev, readout: ayushReadout(text) } : prev));
  }

  const answeredQuiz = quiz.filter((_, i) => picks[i] !== undefined).length;

  return (
    <div className="ayush-light bg-[#f4f4f4] pb-4 text-zinc-900">
      <Masthead />
      <Page
        title="ai assessment"
        sub="paste your background. the ai writes questions about your lines, not a fixed bank. offline → bank questions fill in."
      >
        <Card>
          <Field label="your resume / clinical background" hint="lines you claim get questioned. lines with proof get trusted.">
            <textarea
              className={`${inputCls} min-h-36 font-mono text-xs leading-5`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="bams 3rd year. assisted 20 opd cases. panchakarma posting done…"
            />
          </Field>
          {notice && <p className="mt-2 font-mono text-xs text-red-400">{notice}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn onClick={generate} disabled={phase === "generating"}>
              {phase === "generating" ? "writing questions…" : "[generate my assessment]"}
            </Btn>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-zinc-600">no resume handy? try:</span>
            {AYUSH_RESUMES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setText(r.text); setNotice(""); }}
                className="border border-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                [{r.label}]
              </button>
            ))}
          </div>
          {banked.length > 0 && (
            <p className="mt-2 font-mono text-[11px] text-zinc-500">
              ai offline — used {banked.join(" + ")}. connect a key for custom questions.
            </p>
          )}
        </Card>

        {phase !== "idle" && (
          <Card className="mt-4">
            <H2>{"// custom quiz"}</H2>
            <ol className="space-y-4">
              {quiz.map((item, i) => (
                <li key={i}>
                  <p className="text-sm leading-6 text-zinc-200">{i + 1}. {item.text}</p>
                  <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label={`question ${i + 1}`}>
                    {item.opts.map((o, j) => (
                      <button
                        key={j}
                        type="button"
                        role="radio"
                        aria-checked={picks[i] === j}
                        onClick={() => setPicks((p) => ({ ...p, [i]: j }))}
                        className={`border px-3 py-2 text-left text-xs leading-5 ${
                          picks[i] === j ? "border-blurple bg-blurple/10 text-zinc-100" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {phase !== "idle" && (
          <Card className="mt-4">
            <H2>{"// interview, your words"}</H2>
            <div className="space-y-3">
              {ivQs.map((q, i) => (
                <Field key={i} label={`${i + 1}. ${q}`}>
                  <textarea
                    className={`${inputCls} min-h-20 text-sm`}
                    value={ivAns[i] || ""}
                    onChange={(e) => setIvAns((p) => ({ ...p, [i]: e.target.value }))}
                    placeholder="answer in 3 sentences, with one number"
                  />
                </Field>
              ))}
            </div>
          </Card>
        )}

        {phase !== "idle" && (
          <Card className="mt-4">
            <H2>{"// evidence check"}</H2>
            <div className="space-y-3">
              {qnr.map((item, i) => (
                <Field key={item.id || i} label={item.text}>
                  {item.type === "yesno" ? (
                    <select className={inputCls} value={qnrAns[item.id || i] || ""} onChange={(e) => setQnrAns((p) => ({ ...p, [item.id || i]: e.target.value }))}>
                      <option value="">choose</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  ) : (
                    <input
                      className={inputCls}
                      value={qnrAns[item.id || i] || ""}
                      onChange={(e) => setQnrAns((p) => ({ ...p, [item.id || i]: e.target.value }))}
                      placeholder={item.type === "url" ? "https://…" : item.type === "choice" ? (item.options || []).join(" / ") : "type here"}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-4">
              <Btn onClick={grade} disabled={answeredQuiz === 0}>
                [grade me] ({answeredQuiz}/{quiz.length} answered)
              </Btn>
            </div>
          </Card>
        )}

        {phase === "graded" && graded && (
          <Card className="mt-4 border-emerald-900">
            <H2>{"// your readout"}</H2>
            <div className="flex flex-wrap items-end gap-4">
              <p className="font-mono text-4xl tabular-nums text-zinc-50">
                {graded.readout.readiness}<span className="text-lg text-zinc-500">/100 readiness</span>
              </p>
              <p className="pb-1 font-mono text-sm text-emerald-300">
                {graded.readout.level.label} · {graded.readout.level.hi}
              </p>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              {graded.readout.level.note} · quiz {graded.quiz.score}/100 · interview {graded.ivAvg.toFixed(1)}/4 · resume {graded.readout.total}/95 · {graded.readout.verifiedCount} verified
            </p>
            <div className="mt-4 space-y-2">
              {graded.readout.skills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-zinc-200">
                      {s.name}
                      {s.verified && <span className="ml-1.5 text-emerald-300">✓ verified</span>}
                      {!s.found && <span className="ml-1.5 text-amber-300">← gap · prove via {s.path}</span>}
                    </span>
                    <span className="font-mono tabular-nums text-zinc-500">{s.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800">
                    <div className={`h-full ${s.verified ? "bg-emerald-400" : "bg-blurple"}`} style={{ width: `${s.confidence}%` }} />
                  </div>
                  {!s.verified && (
                    <ProofLogger skill={s.name} onLogged={refreshReadout} />
                  )}
                </div>
              ))}
            </div>
            <div className="my-4 border-t border-zinc-800" aria-hidden />
            <div className="flex flex-wrap gap-2">
              <Btn to="/quests" variant="quiet" size="sm">open quests</Btn>
              <Btn to="/ayush/roles" variant="quiet" size="sm">browse ayush roles</Btn>
            </div>
          </Card>
        )}
      </Page>
    </div>
  );
}
