// Home: the dashboard the congrats button lands on. Quests, internships +
// jobs, and the AI coach in one glance — every card links somewhere real.
import { Page, Card, H2, Btn, Chip, CountUp, VaidyaLevel } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { loadProfile } from "../lib/profile.js";
import { JOBS, matchJobs } from "../data/jobs.js";
import { coursesFor } from "../data/courses.js";
import { calculateMainScore, questPairsToProof } from "../lib/score.js";
import { completedSkillIdsForRole } from "../lib/progress.js";
import { loadJSON } from "../lib/storage.js";
import { onboardingProgress } from "../lib/onboarding.js";
import { vaidyaLevel } from "../ayush/scoring.js";

export default function Home() {
  const { resume } = useC2C();
  const profile = loadProfile() || {};
  const result = resume?.result || null;
  const found = result?.found || [];
  const missing = result?.missing || [];
  const interviewBest = loadJSON("c2c-interview-best", 0);
  const pairs = completedSkillIdsForRole("ayush").length;
  const main = result ? calculateMainScore(result.total, interviewBest, questPairsToProof(pairs), "ayush") : 0;
  const vaidya = vaidyaLevel(main);
  const loop = onboardingProgress({
    profileDone: Boolean(profile.skills && profile.goal),
    resumeDone: Boolean(result),
    interviewDone: interviewBest > 0,
  });
  const topJobs = matchJobs("ayush", main, found, JOBS).slice(0, 3);

  return (
    <Page
      title="Your home"
      sub={
        profile.year || profile.lane
          ? `${profile.year || "BAMS"}${profile.lane ? ` · ${profile.lane} lane` : ""}${profile.goal ? ` · here to ${profile.goal}` : ""}`
          : "Your quests, matches, and coach — one screen."
      }
    >
      {loop.total < 100 && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-700">Profile {loop.total}% — finish the loop to unlock full matches.</p>
            <Btn to="/journey" size="sm">Continue journey</Btn>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="font-mono text-[11px] uppercase tracking-wide text-stone-400">Readiness</p>
          <p className="font-display text-5xl font-bold tabular-nums text-stone-900">
            <CountUp to={main} /><span className="text-lg text-stone-400">/100</span>
          </p>
          <div className="mt-2"><VaidyaLevel level={vaidya.id} /></div>
          <p className="mt-1 font-mono text-xs text-emerald-700">{vaidya.label} · {vaidya.hi}</p>
          <div className="mt-3 flex gap-2">
            <Btn to="/resume" variant="quiet" size="sm">Resume</Btn>
            <Btn to="/interview" variant="quiet" size="sm">Interview</Btn>
          </div>
        </Card>

        <Card>
          <H2>Up next: quests</H2>
          {missing.length === 0 && !result ? (
            <p className="text-sm text-stone-500">Score your resume and gaps turn into quests here.</p>
          ) : missing.length === 0 ? (
            <p className="text-sm text-stone-500">No gaps. Interview prep is your next win.</p>
          ) : (
            <ul className="space-y-2">
              {missing.slice(0, 3).map((s) => (
                <li key={s} className="rounded-xl border border-stone-200 px-3 py-2">
                  <p className="text-sm font-semibold capitalize text-stone-800">{s}</p>
                  <p className="truncate text-xs text-stone-500">{coursesFor(s)[0]?.t || "Free quest in the quest list"}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3"><Btn to="/quests" variant="quiet" size="sm">Open quests</Btn></div>
        </Card>

        <Card>
          <H2>Top matches</H2>
          <ul className="space-y-2">
            {topJobs.map((j) => (
              <li key={j.id} className="rounded-xl border border-stone-200 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-800">{j.title}</p>
                  <Chip tone={j.eligible ? "green" : "amber"}>{j.eligible ? "eligible" : `${j.minScore} needed`}</Chip>
                </div>
                <p className="text-xs text-stone-500">{j.company} · {j.type}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3"><Btn to="/jobs" variant="quiet" size="sm">All internships & jobs</Btn></div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <H2 className="mb-1">AI coach knows your profile</H2>
            <p className="text-sm text-stone-500">
              {profile.lane ? `Trained on your ${profile.lane} lane` : "Trained on your answers"}
              {missing[0] ? ` — biggest gap: ${missing[0]}` : ""}. Bottom-right bubble, anytime.
            </p>
          </div>
          <Btn to="/home?chat=1">Ask the coach</Btn>
        </div>
      </Card>
    </Page>
  );
}
