import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Empty, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { COACH_ACTIONS, buildPrompt, localAnswer } from "../lib/coach.js";
import { chat } from "../lib/ai.js";
import { saveArtifact } from "../lib/backend.js";
import { extractContact } from "../lib/parseResume.js";
import { ROLES, rankRoles } from "../lib/score.js";
import { JOBS } from "../data/jobs.js";

// Offline-first: every action answers instantly from local logic. The AI key
// (VITE_GROQ_KEY) upgrades the same answer, never gates it.
export default function Coach() {
  const { role, resume } = useC2C();
  const [log, setLog] = useState([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  const s = useMemo(() => {
    const r = resume?.result;
    const fit = resume?.text ? rankRoles(resume.text)[0] : null;
    const topJob = JOBS.filter((j) => j.role === role).slice(0, 1)[0] || null;
    return {
      roleLabel: ROLES[role]?.label || role,
      score: r?.total || 0,
      breakdown: r?.breakdown || [],
      found: r?.found || [],
      missing: r?.missing || [],
      bestFitLabel: fit ? ROLES[fit.key]?.label : "",
      topJob,
      resumeText: resume?.text || "",
      contactName: resume?.text ? extractContact(resume.text).name : "",
    };
  }, [role, resume]);

  function push(kind, text) {
    setLog((prev) => [...prev, { kind, text }].slice(-30));
  }

  async function run(actionId, extra = {}) {
    const answer = localAnswer(actionId, { ...s, ...extra });
    push("you", actionId === "ask" ? extra.question : COACH_ACTIONS.find((a) => a.id === actionId)?.label || "Question");
    push("coach", answer);
    if (actionId === "match" || actionId === "cover" || actionId === "review") {
      saveArtifact({ kind: actionId, title: `${actionId} for ${s.roleLabel}`, body: answer }).catch(() => {});
    }
    if (!import.meta.env.VITE_GROQ_KEY) return;
    setBusy(true);
    try {
      const better = await chat(buildPrompt(actionId, { ...s, ...extra }), "coach");
      if (better && better !== answer) push("coach-ai", better);
    } catch {
      // offline answer already stands
    }
    setBusy(false);
  }

  return (
    <Page title="Coach" sub="Instant answers from your own data. Add the AI key in app/.env for upgraded replies.">
      <Card>
        <H2>Quick actions</H2>
        <div className="flex flex-wrap gap-2">
          {COACH_ACTIONS.filter((a) => a.id !== "addjob").map((a) => (
            <Btn key={a.id} variant="quiet" onClick={() => run(a.id)} disabled={busy}>
              {a.label}
            </Btn>
          ))}
          <Btn variant="quiet" to="/jobs">Add job from posting lives on Jobs</Btn>
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!question.trim() || busy) return;
            run("ask", { question: question.trim() });
            setQuestion("");
          }}
        >
          <Field label="Ask anything about your resume or track">
            <input className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="How do I fix my projects section?" />
          </Field>
          <div className="flex items-end">
            <Btn type="submit" disabled={busy || !question.trim()}>{busy ? "Thinking..." : "Ask"}</Btn>
          </div>
        </form>
      </Card>

      <div className="mt-4 space-y-3">
        {log.length === 0 && (
          <Empty title="No conversation yet" body="Pick a quick action or ask a question. Replies marked AI used the online model, the rest came from your data offline." />
        )}
        {log.map((m, i) => (
          <Card key={i} className={m.kind === "you" ? "border-zinc-300 bg-zinc-50" : ""}>
            <p className="mb-1 text-xs font-semibold text-zinc-500">
              {m.kind === "you" ? "You" : m.kind === "coach-ai" ? "Coach (AI)" : "Coach"}
            </p>
            <p className="whitespace-pre-line text-sm text-zinc-800">{m.text}</p>
          </Card>
        ))}
      </div>
    </Page>
  );
}
