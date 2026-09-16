import { useEffect, useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Chip, Empty, ErrorBox, Donut, DONUT_COLORS_EXPORT, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { JOBS, matchJobs } from "../data/jobs.js";
import { EXTRA_JOBS } from "../data/seedJobsExtra.js";
import { NAUKRI_JOBS } from "../data/naukriSeed.js";
import { BOARDS_JOBS } from "../data/boardsSeed.js";
import { mergeJobs, listLiveJobs, recordApplication, saveCustomJob } from "../lib/store.js";
import { loadProfile } from "../lib/profile.js";
import { matchJob, matchBand, parseJobPosting } from "../lib/coach.js";
import { donutSegments, weekTrend, recentActivity, briefing } from "../lib/dashboard.js";
import { calculateMainScore } from "../lib/score.js";

const STATUS_FLOW = ["saved", "applied", "interview", "offer"];

function statusOf(events, id) {
  const mine = events.filter((e) => e.jobId === String(id));
  if (mine.some((e) => e.event === "rejected")) return "rejected";
  if (mine.some((e) => e.event === "offer")) return "offer";
  if (mine.some((e) => e.event === "interview")) return "interview";
  if (mine.some((e) => e.event === "applied")) return "applied";
  if (mine.some((e) => e.event === "saved")) return "saved";
  return null;
}

export default function Jobs() {
  const { role, resume, events, addEvent, dismissed, toggleDismiss, customJobs, addCustomJob, funnel } = useC2C();
  const [kw, setKw] = useState("");
  const [loc, setLoc] = useState("");
  const [type, setType] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [live, setLive] = useState([]);
  const [liveState, setLiveState] = useState("idle");
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState(null);
  const [notice, setNotice] = useState("");

  const found = useMemo(() => resume?.result?.found || [], [resume]);
  const score = resume?.result ? calculateMainScore(resume.result.total, 0, 0, role) : 0;

  const pool = useMemo(
    () => matchJobs(role, score, found, mergeJobs(customJobs, EXTRA_JOBS, NAUKRI_JOBS, BOARDS_JOBS, JOBS, live)),
    [role, score, found, customJobs, live]
  );
  const byId = useMemo(() => Object.fromEntries(pool.map((j) => [String(j.id), j])), [pool]);

  const filtered = pool.filter((j) => {
    if (!showDismissed && dismissed.includes(String(j.id))) return false;
    if (eligibleOnly && !j.eligible) return false;
    if (type !== "all" && j.type !== type) return false;
    if (kw && !`${j.title} ${j.company} ${j.skills.join(" ")}`.toLowerCase().includes(kw.toLowerCase())) return false;
    if (loc && !(j.loc || "").toLowerCase().includes(loc.toLowerCase())) return false;
    return true;
  });

  const segs = useMemo(
    () => donutSegments([["Saved", funnel.saved], ["Applied", funnel.applied], ["Interview", funnel.interview], ["Offer", funnel.offer], ["Rejected", funnel.rejected]]),
    [funnel]
  );
  const trend = useMemo(() => weekTrend(events), [events]);
  const trendMax = Math.max(1, ...trend.map((d) => d.saved + d.applied));
  const recent = useMemo(() => recentActivity(events, byId), [events, byId]);
  const brief = useMemo(
    () => briefing({ funnel, jobs: pool, found, missing: resume?.result?.missing || [], mainScore: score }),
    [funnel, pool, found, resume, score]
  );

  async function refreshLive() {
    setLiveState("loading");
    try {
      const jobs = await listLiveJobs(true, loadProfile() || {});
      setLive(jobs);
      setLiveState("done");
    } catch {
      setLiveState("error");
    }
  }

  useEffect(() => {
    listLiveJobs(false).then(setLive).catch(() => {});
  }, []);

  async function markApplied(job) {
    try {
      await recordApplication(job, job.apply || "#", score);
      addEvent(String(job.id), "applied");
      setNotice(`Marked applied: ${job.title}. Good luck.`);
    } catch {
      setNotice("Could not record that application. Try again.");
    }
  }

  function confirmPasted() {
    if (!parsed) return;
    const job = { ...parsed, role, minScore: 0 };
    saveCustomJob(job);
    addCustomJob(job);
    setParsed(null);
    setPaste("");
    setNotice(`Added "${job.title}". It now appears in your feed.`);
  }

  return (
    <Page
      title="Jobs"
      sub="Open roles matched to your skills. Save, apply, and follow each one through the pipeline."
      actions={<Btn variant="quiet" onClick={refreshLive}>{liveState === "loading" ? "Refreshing..." : "Refresh live roles"}</Btn>}
    >
      {liveState === "error" && (
        <ErrorBox message="Live boards did not respond. The curated feed below still works." onRetry={refreshLive} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <H2>Where your pipeline stands</H2>
          <div className="flex items-center gap-4">
            <Donut segs={segs} label="Pipeline distribution across saved, applied, interview, offer, rejected" />
            <ul className="space-y-1.5">
              {segs.map((s, i) => (
                <li key={s.label} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.label === "none" ? "#d4d4d8" : DONUT_COLORS_EXPORT[i % DONUT_COLORS_EXPORT.length] }} />
                  <span className="text-zinc-400">{s.label}</span>
                  <span className="ml-auto pl-3 font-medium tabular-nums text-zinc-200">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card>
          <H2>Activity, last 7 days</H2>
          <div className="flex h-24 items-end gap-2">
            {trend.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1" title={`${d.saved} saved, ${d.applied} applied`}>
                <div className="flex h-16 w-full flex-col justify-end gap-0.5">
                  {d.applied > 0 && <div className="w-full rounded-sm bg-blurple" style={{ height: `${Math.max(8, (d.applied / trendMax) * 64)}px` }} />}
                  {d.saved > 0 && <div className="w-full rounded-sm bg-zinc-300" style={{ height: `${Math.max(6, (d.saved / trendMax) * 64)}px` }} />}
                </div>
                <span className="text-[10px] text-zinc-400">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">Blurple bars are applications, grey bars are saves.</p>
        </Card>
        <Card>
          <H2>What matters today</H2>
          <ul className="space-y-1.5">
            {brief.map((b, i) => <li key={i} className="text-xs leading-snug text-zinc-400">{b}</li>)}
          </ul>
          {recent.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-2.5">
              {recent.slice(0, 3).map((r, i) => (
                <li key={i} className="truncate text-[11px] text-zinc-400">
                  <span className="capitalize text-zinc-700">{r.event}</span>: {r.title}{r.company ? ` at ${r.company}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Keyword">
            <input className={inputCls} value={kw} onChange={(e) => setKw(e.target.value)} placeholder="react, analyst" />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="remote, bangalore" />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Govt">Govt</option>
            </select>
          </Field>
          <div className="flex items-end gap-4 pb-2 text-sm text-zinc-700">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Eligible only</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} /> Show dismissed</label>
          </div>
        </div>
      </Card>

      {notice && <p className="mt-3 text-sm text-blurple-soft">{notice}</p>}

      {!resume && (
        <div className="mt-4">
          <Empty title="Scores unlock matches" body="Match percentages and eligibility gates appear after you score a resume. The feed below is still browsable." action={<Btn to="/resume">Score your resume</Btn>} />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((j) => {
          const m = matchJob(found, j);
          const st = statusOf(events, j.id);
          return (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{j.title}</h3>
                  <p className="text-sm text-zinc-400">{j.company} · {j.loc} · {j.type}{j.src ? ` · via ${j.src}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m && <Chip tone={m.score >= 65 ? "green" : m.score >= 50 ? "blue" : "zinc"}>{m.score}/100 {matchBand(m.score)}</Chip>}
                  {j.eligible ? <Chip tone="green">Eligible</Chip> : <Chip tone="amber">Needs {j.minScore}+</Chip>}
                  {st && <Chip tone="blue">{st}</Chip>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {j.skills.map((s) => (
                  <Chip key={s} tone={found.map((f) => f.toLowerCase()).includes(s.toLowerCase()) ? "green" : "zinc"}>{s}</Chip>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {j.apply && j.apply !== "#" && (
                  <a className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blurple px-4 py-2 text-sm font-medium text-white hover:bg-blurple-deep" href={j.apply} target="_blank" rel="noreferrer">
                    Apply on source site
                  </a>
                )}
                {!st && <Btn variant="quiet" onClick={() => addEvent(String(j.id), "saved")}>Save</Btn>}
                {st === "saved" && <Btn variant="quiet" onClick={() => markApplied(j)}>Mark applied</Btn>}
                {st && STATUS_FLOW.includes(st) && st !== "offer" && (
                  <Btn variant="quiet" onClick={() => addEvent(String(j.id), STATUS_FLOW[STATUS_FLOW.indexOf(st) + 1])}>
                    Move to {STATUS_FLOW[STATUS_FLOW.indexOf(st) + 1]}
                  </Btn>
                )}
                {st !== "rejected" && <Btn variant="dangerQuiet" onClick={() => addEvent(String(j.id), "rejected")}>Rejected</Btn>}
                <Btn variant="quiet" onClick={() => toggleDismiss(String(j.id))}>
                  {dismissed.includes(String(j.id)) ? "Restore" : "Dismiss"}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="mt-4">
          <Empty title="No roles match those filters" body="Loosen a filter, or paste a posting below to add it to your feed." />
        </div>
      )}

      <Card className="mt-6">
        <H2>Add a role from a posting</H2>
        <Field label="Paste the job ad" hint="The parser reads title, company, location, and skills. Confirm before it saves.">
          <textarea className={`${inputCls} min-h-24 font-mono text-xs`} value={paste} onChange={(e) => { setPaste(e.target.value); setParsed(parseJobPosting(e.target.value)); }} placeholder="Paste the full posting here" />
        </Field>
        {parsed && (
          <div className="mt-3 rounded-lg border border-blurple/30 bg-blurple/10 p-4">
            <p className="text-sm font-semibold text-zinc-100">{parsed.title}</p>
            <p className="text-sm text-zinc-400">{parsed.company} · {parsed.loc} · {parsed.type}</p>
            <p className="mt-1 text-xs text-zinc-400">Skills read: {parsed.skills.join(", ") || "none"}</p>
            <Btn className="mt-3" onClick={confirmPasted}>Confirm and add to feed</Btn>
          </div>
        )}
      </Card>
    </Page>
  );
}
