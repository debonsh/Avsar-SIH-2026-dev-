// [ayush] the ayush job + internship finder. search, kind filter, fit-ranked
// cards with stipend + deadline. apply tracking reuses the shared pipeline
// (read-only usage). tech portal untouched. rollback: delete src/ayush/.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Page, Card, H2, Btn, Field, Chip, Empty, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import Masthead from "./Masthead.jsx";
import { AYUSH_JOBS } from "./seed.js";
import { AYUSH_FEED_JOBS, AYUSH_FEED_AT } from "./feed.js";
import { matchJob, matchBand } from "../lib/coach.js";
import { recordApplication } from "../lib/store.js";
import { calculateMainScore } from "../lib/score.js";

const KINDS = ["all", "Internship", "Full-time", "Govt", "ministry", "research", "training"];

function statusOf(events, id) {
  const mine = (events || []).filter((e) => String(e.jobId) === String(id));
  if (mine.some((e) => e.event === "applied")) return "applied";
  if (mine.some((e) => e.event === "saved")) return "saved";
  return null;
}

export default function AyushJobs() {
  const { resume, events, addEvent } = useC2C();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [notice, setNotice] = useState("");

  const found = resume?.result?.found || [];
  const score = resume?.result ? calculateMainScore(resume.result.total, 0, 0, "ayush") : 0;

  const pool = useMemo(
    () =>
      [...AYUSH_JOBS.filter((j) => j.role === "ayush"), ...AYUSH_FEED_JOBS]
        .map((j) => ({ ...j, fit: matchJob(found, j), eligible: score >= j.minScore }))
        .sort((a, b) => (b.eligible - a.eligible) || ((b.fit?.score || 0) - (a.fit?.score || 0))),
    [found, score]
  );

  const list = pool.filter((j) => {
    if (kind !== "all" && j.type !== kind && j.kind !== kind) return false;
    if (eligibleOnly && !j.eligible) return false;
    if (q && !`${j.title} ${j.company} ${j.loc} ${(j.skills || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function apply(job) {
    try {
      await recordApplication(job, job.apply || "#", score);
      addEvent(String(job.id), "applied");
      setNotice(`applied: ${job.title}. tracked in your pipeline.`);
    } catch {
      setNotice("could not record that application. try again.");
    }
  }

  return (
    <div className="ayush-light bg-[#f4f4f4] pb-4 text-zinc-900">
      <Masthead />
      <Page
        title="ayush roles"
        sub={`${pool.length} live postings · internships, ministry programs, research, training. fit computed from your resume.`}
        actions={!resume && <Btn to="/ayush/assess" variant="quiet">score yourself first</Btn>}
      >
        <Card>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="search">
              <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="panchakarma, research, kerala" />
            </Field>
            <Field label="kind">
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>{k === "all" ? "everything" : k}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> eligible only
              </label>
            </div>
          </div>
        </Card>

        {notice && <p className="mt-3 font-mono text-xs text-blurple-soft">{notice}</p>}

        <div className="mt-4 space-y-3">
          {list.map((j) => {
            const st = statusOf(events, j.id);
            return (
              <Card key={j.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-mono text-sm font-medium text-zinc-100">{j.title}</h3>
                    <p className="font-mono text-xs text-zinc-500">{j.company} · {j.loc} · {j.type}</p>
                    {(j.stipend || j.deadline) && (
                      <p className="mt-0.5 font-mono text-[11px] text-sage">
                        {[j.stipend, j.deadline ? `apply: ${j.deadline}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {j.src === "ccras" && <Chip tone="blue">fresh · ccras</Chip>}
                    {j.fit && <Chip tone={j.fit.score >= 65 ? "green" : j.fit.score >= 50 ? "blue" : "zinc"}>{j.fit.score}/100 {matchBand(j.fit.score)}</Chip>}
                    {j.eligible ? <Chip tone="green">eligible</Chip> : <Chip tone="amber">needs {j.minScore}+</Chip>}
                    {j.kind && <Chip>{j.kind}</Chip>}
                    {st && <Chip tone="blue">{st}</Chip>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(j.skills || []).map((s) => (
                    <Chip key={s} tone={found.map((f) => f.toLowerCase()).includes(s.toLowerCase()) ? "green" : "zinc"}>{s}</Chip>
                  ))}
                </div>
                {!st && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn size="sm" onClick={() => apply(j)}>[apply + track]</Btn>
                    <Btn size="sm" variant="quiet" onClick={() => addEvent(String(j.id), "saved")}>save</Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        {list.length === 0 && (
          <div className="mt-4">
            <Empty title="no roles match" body="loosen a filter. new ministry + ccras postings land here first." />
          </div>
        )}
        <p className="mt-4 font-mono text-[11px] text-zinc-600">
          {"// ccras feed refresh: npm run ayush:feed · last "}{AYUSH_FEED_AT}{" · ministry + ccras official pages linked above. always verify before travelling."} <Link to="/jobs" className="text-blurple-soft underline underline-offset-4">full feed →</Link>
        </p>
      </Page>
    </div>
  );
}
