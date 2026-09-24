// Tech home: the console the tech portal lands on. Built as an operations
// summary, not a card grid: a flat status header, a hairline ledger of the
// four numbers that matter, a notice banner while the loop is open, proof of
// work, then today's docket as numbered rows. Home.jsx picks this for
// track=tech. Dial ENERGY 1 / RHYTHM 2 / MOTION 1: static, hover feedback only.
import CIcon from "@coreui/icons-react";
import {
  cilDescription, cilCheckCircle,
  cilArrowRight, cilFire, cilClock,
} from "@coreui/icons";
import { Page, Card, H2, Btn, Chip } from "../components/ui.jsx";
import { useAvsar } from "../app/store.jsx";
import { TECH_JOBS, matchJobs } from "../data/jobs.js";
import { coursesFor } from "../data/courses.js";
import { calculateMainScore, questPairsToProof, engLevelFor, ROLES } from "../lib/score.js";
import { completedSkillIdsForRole } from "../lib/progress.js";
import { loadJSON } from "../lib/storage.js";
import { onboardingProgress } from "../lib/onboarding.js";
import { MonoActivityHeatmap } from "../components/MonoActivityHeatmap.jsx";
import XpMeter from "../components/XpMeter.jsx";
import { collectDayCounts } from "../lib/streak.js";

function IconBadge({ icon, tone = "blurple", size = 18 }) {
  const tones = {
    blurple: "bg-blurple/15 text-blurple-soft",
    zinc: "bg-zinc-900 text-zinc-300",
    amber: "bg-amber-950 text-amber-300",
    red: "bg-red-950 text-red-300",
  };
  return (
    <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`} aria-hidden>
      <CIcon icon={icon} width={size} height={size} />
    </span>
  );
}

function Ring({ value }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(100, value)) / 100;
  return (
    <span className="relative inline-flex items-center justify-center text-zinc-700" role="img" aria-label={`Readiness ${value} of 100`}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90" aria-hidden>
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="9" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke="#9aa4ff" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(frac * c).toFixed(1)} ${c.toFixed(1)}`}
        />
      </svg>
      <span className="absolute font-display text-2xl font-bold tabular-nums text-zinc-50">{value}</span>
    </span>
  );
}

// One ledger row: value over label, tabular figures. No icon: the number is
// the content, and four icons in a row would be decoration, not signal.
function LedgerCell({ label, value }) {
  return (
    <div className="bg-zinc-950 px-4 py-3.5">
      <p className="font-display text-xl font-bold tabular-nums text-zinc-50">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default function TechHome() {
  const { lane, profile, resume } = useAvsar();
  const p = profile || {};
  const result = resume?.result || null;
  const found = result?.found || [];
  const missing = result?.missing || [];
  const interviewBest = loadJSON("avsar-interview-best", 0);
  const pairs = completedSkillIdsForRole(lane).length;
  const main = result ? calculateMainScore(result.total, interviewBest, questPairsToProof(pairs), lane) : 0;
  // Tech leveling is its own engineering ladder (L0-L5), never the vaidya
  // growth stages. Same thresholds family as the old console ranks.
  const eng = engLevelFor(main);
  const loop = onboardingProgress({
    profileDone: Boolean(p.track && p.skills && p.goal),
    resumeDone: Boolean(result),
    interviewDone: interviewBest > 0,
  });
  const topJobs = matchJobs(lane, main, found, TECH_JOBS).slice(0, 3);
  const skills = String(p.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const roleName = ROLES[lane]?.label || "your track";

  const ledger = [
    { label: "Readiness", value: result ? `${main}/100` : "–" },
    { label: "Skills proven", value: String(found.length || skills.length) },
    { label: "Interview best", value: interviewBest > 0 ? String(interviewBest) : "–" },
    { label: "Quest pairs", value: String(pairs) },
  ];

  return (
    <Page
      title="Your home"
      sub={
        result
          ? `${roleName} · readiness ${main}/100 · ${eng.label}`
          : `${roleName} · score a resume to start the loop`
      }
    >
      {/* status header: flat panel, ring is the one figure because readiness
          is the number this portal checks daily. */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6 sm:px-7">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-blurple-soft">
          <CIcon icon={cilDescription} width={14} height={14} /> Avsar command center
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold leading-tight text-zinc-50 sm:text-3xl">
              {p.track ? `On the ${roleName} track.` : "Pick your track and start scoring."}
            </h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-zinc-400">
              {loop.total < 100
                ? `Profile ${loop.total}%. Finish the loop; recruiters read proof, not promises.`
                : "Full loop done. Today's board: one quest, one application, one question for the coach."}
            </p>
            <div className="mt-3 flex max-w-xs items-center gap-1" aria-hidden>
              {[40, 30, 30].map((w, i) => (
                <span key={i} className={`h-1.5 rounded-full ${loop.total >= 100 || (i === 0 && loop.total >= 40) || (i === 1 && loop.total >= 70) ? "bg-blurple" : "bg-zinc-800"}`} style={{ flex: w }} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn to={loop.total < 100 ? "/journey" : "/jobs"}>
                {loop.total < 100 ? "Continue journey" : "Today's matches"} <CIcon icon={cilArrowRight} width={15} height={15} />
              </Btn>
              <Btn to="/home?chat=1" variant="quiet">
                Ask the coach
              </Btn>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Ring value={main} />
            <span className="inline-flex items-center gap-1 rounded-full bg-blurple/15 px-2.5 py-1 text-[11px] font-semibold text-blurple-soft" title={eng.note}>
              <CIcon icon={cilFire} width={12} height={12} /> {eng.label}
            </span>
          </div>
        </div>
      </section>

      {/* ledger: the four numbers that matter, hairline rules, one panel. */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 lg:grid-cols-4" role="group" aria-label="Progress summary">
        {ledger.map((s) => (
          <LedgerCell key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {loop.total < 100 && (
        <Card className="mt-4 flex flex-wrap items-center gap-3 border-amber-900 bg-amber-950">
          <IconBadge icon={cilFire} tone="amber" />
          <p className="min-w-0 flex-1 text-sm text-amber-300">
            Profile {loop.total}%. Finish the loop to unlock full matches.
          </p>
          <Btn to="/journey" size="sm">Continue journey</Btn>
        </Card>
      )}

      {/* proof of work */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MonoActivityHeatmap theme="dark" accentColor="purple" compact days={collectDayCounts()} />
        <XpMeter />
      </div>

      {/* today's docket: numbered rows in one panel, each row ends at the
          screen that finishes it. Rows, not cards, because the docket is a
          sequence: first learn, then apply, then ask. */}
      <section className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950" aria-label="Today's moves">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5 sm:px-5">
          <CIcon icon={cilClock} width={15} height={15} className="text-blurple-soft" aria-hidden />
          <H2 className="mb-0">Today&apos;s moves</H2>
        </div>
        <ol className="divide-y divide-zinc-800">
          <li className="flex flex-wrap items-start gap-3 px-4 py-4 sm:px-5">
            <span className="font-mono text-xs font-medium tabular-nums text-zinc-500" aria-hidden>01</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-100">Learn</p>
              {missing.length === 0 && !result ? (
                <p className="mt-0.5 text-sm leading-6 text-zinc-400">Score your resume and gaps turn into quests here.</p>
              ) : missing.length === 0 ? (
                <p className="mt-0.5 text-sm leading-6 text-zinc-400">No gaps. Interview prep is your next win.</p>
              ) : (
                <ul className="mt-1.5 space-y-1.5">
                  {missing.slice(0, 3).map((s) => (
                    <li key={s} className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold capitalize text-zinc-100">{s}</span>
                      <span className="truncate text-xs text-zinc-500">{coursesFor(s)[0]?.t || "Free quest in the quest list"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Btn to="/quests" variant="quiet" size="sm" className="shrink-0">Open quests <CIcon icon={cilArrowRight} width={14} height={14} /></Btn>
          </li>
          <li className="flex flex-wrap items-start gap-3 px-4 py-4 sm:px-5">
            <span className="font-mono text-xs font-medium tabular-nums text-zinc-500" aria-hidden>02</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-100">Apply</p>
              <ul className="mt-1.5 space-y-1.5">
                {topJobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0">
                      <span className="font-semibold text-zinc-100">{j.title}</span>
                      <span className="text-xs text-zinc-500"> · {j.company} · {j.type}</span>
                    </span>
                    <Chip tone={j.eligible ? "green" : "amber"}>{j.eligible ? "eligible" : `${j.minScore} needed`}</Chip>
                  </li>
                ))}
              </ul>
            </div>
            <Btn to="/jobs" variant="quiet" size="sm" className="shrink-0">All internships and jobs <CIcon icon={cilArrowRight} width={14} height={14} /></Btn>
          </li>
          <li className="flex flex-wrap items-start gap-3 px-4 py-4 sm:px-5">
            <span className="font-mono text-xs font-medium tabular-nums text-zinc-500" aria-hidden>03</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-100">Ask</p>
              <p className="mt-0.5 flex items-start gap-1.5 text-sm leading-6 text-zinc-300">
                <CIcon icon={cilCheckCircle} width={15} height={15} className="mt-1 shrink-0 text-blurple-soft" />
                <span>
                  {p.track ? `Coached for your ${roleName} track` : "Coached on your answers"}
                  {missing[0] ? ` (biggest gap today: ${missing[0]}).` : "."}
                </span>
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-6 text-zinc-300">
                <CIcon icon={cilCheckCircle} width={15} height={15} className="mt-1 shrink-0 text-blurple-soft" />
                Lives in the bottom-right bubble, on every screen.
              </p>
            </div>
            <Btn to="/home?chat=1" size="sm" className="shrink-0">Ask the coach <CIcon icon={cilArrowRight} width={14} height={14} /></Btn>
          </li>
        </ol>
      </section>
    </Page>
  );
}
