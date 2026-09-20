import { useEffect, useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Chip, Empty, ErrorBox, Donut, DONUT_COLORS_EXPORT, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { JOBS, matchJobs } from "../data/jobs.js";
import { EXTRA_JOBS } from "../data/seedJobsExtra.js";
import { NAUKRI_JOBS } from "../data/naukriSeed.js";
import { BOARDS_JOBS } from "../data/boardsSeed.js";
import { AYUSH_ENABLED, AYUSH_JOBS } from "../data/ayushSeed.js"; // [ayush] rollback: delete import + spread
import { mergeJobs, listLiveJobs, recordApplication, saveCustomJob } from "../lib/store.js";
import { loadProfile } from "../lib/profile.js";
import { matchJob, matchBand, parseJobPosting } from "../lib/coach.js";
import { donutSegments, weekTrend, recentActivity, briefing, demandHeatmap } from "../lib/dashboard.js";
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
    () => matchJobs(role, score, found, mergeJobs(customJobs, AYUSH_ENABLED ? AYUSH_JOBS : [], EXTRA_JOBS, NAUKRI_JOBS, BOARDS_JOBS, JOBS, live)),
    [role, score, found, customJobs, live]
  );
  // Ayush roles sort first when role=ayush
  const sortedPool = useMemo(() => {
    if (role !== "ayush") return pool;
    return [...pool].sort((a, b) => {
      const aAyush = a.role === "ayush" ? 0 : 1;
      const bAyush = b.role === "ayush" ? 0 : 1;
      return aAyush - bAyush || (b.eligible - a.eligible) || ((b.fit?.score || 0) - (a.fit?.score || 0));
    });
  }, [pool, role]);

  const byId = useMemo(() => Object.fromEntries(sortedPool.map((j) => [String(j.id), j])), [sortedPool]);

  const filtered = sortedPool.filter((j) => {
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
    () => briefing({ funnel, jobs: sortedPool, found, missing: resume?.result?.missing || [], mainScore: score }),
    [funnel, sortedPool, found, resume, score]
  );
  const heat = useMemo(() => demandHeatmap(sortedPool, found, 10), [sortedPool, found]);
  const heatMax = Math.max(1, ...heat.map((h) => h.demand));

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

  const isAyush = role === "ayush";

  return (
    <Page
      title={isAyush ? "Ayush Roles" : "Jobs"}
      sub={isAyush
        ? `${pool.length} live ayush postings · internships, ministry programs, research, training. fit computed from your resume.`
        : "Open roles matched to your skills. Save, apply, and follow each one through the pipeline."
      }
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
                  <span className="h-2 w-2 shrink-0 rounded-none" style={{ background: s.label === "none" ? "#d4d4d8" : DONUT_COLORS_EXPORT[i % DONUT_COLORS_EXPORT.length] }} />
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
              {isAyush ? (
                <>
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Govt">Govt</option>
                  <option value="ministry">Ministry</option>
                  <option value="research">Research</option>
                  <option value="training">Training</option>
                </>
              ) : (
                <>
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Govt">Govt</option>
                </>
              )}
            </select>
          </Field>
          <div className="flex items-end gap-4 pb-2 text-sm text-zinc-700">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Eligible only</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} /> Show dismissed</label>
          </div>
        </div>
      </Card>

      {notice && <p className="mt-3 text-sm text-blurple-soft">{notice}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <H2>{"// demand vs your supply"}</H2>
          <ul className="space-y-1.5">
            {heat.map((h) => (
              <li key={h.skill} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-zinc-300">{h.skill}</span>
                <span className="h-2 flex-1 bg-zinc-800">
                  <span className={`block h-full ${h.have ? "bg-blurple" : "bg-zinc-500"}`} style={{ width: `${Math.max(4, (h.demand / heatMax) * 100)}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right font-mono tabular-nums text-zinc-500">{h.demand}</span>
                <Chip tone={h.have ? "green" : "amber"}>{h.have ? "have" : "gap"}</Chip>
              </li>
            ))}
            {heat.length === 0 && <li className="text-xs text-zinc-500">no postings in the feed yet.</li>}
          </ul>
        </Card>
        <Card>
          <H2>{"// how fit is computed"}</H2>
          <p className="text-xs leading-5 text-zinc-400">
            fit = share of required skills found on your resume. no black box:
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs tabular-nums text-zinc-400">
            <li><span className="text-zinc-200">80+</span> strong fit</li>
            <li><span className="text-zinc-200">65+</span> good fit</li>
            <li><span className="text-zinc-200">50+</span> partial fit</li>
            <li><span className="text-zinc-200">35+</span> weak fit</li>
            <li><span className="text-zinc-200">below</span> poor fit</li>
          </ul>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            eligibility is separate: your readiness must clear the role bar. close one gap to move both numbers.
          </p>
        </Card>
      </div>

      {!resume && (
        <div className="mt-4">
          <Empty title="Scores unlock matches" body="Match percentages and eligibility gates appear after you score a resume. The feed below is still browsable." action={<Btn to="/resume">Score your resume</Btn>} />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((j) => {
          const st = statusOf(events, j.id);
          const isAyushJob = j.role === "ayush" || j.kind === "ministry" || j.kind === "research" || j.kind === "training";
          return (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{j.title}</h3>
                  <p className="text-sm text-zinc-400">{j.company} · {j.loc} · {j.type}{j.src ? ` · via ${j.src}` : ""}</p>
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
                  {isAyushJob && <Chip tone="sage">ayush</Chip>}
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
