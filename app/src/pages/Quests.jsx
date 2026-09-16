// Quests: turn every missing skill into proof. Progress is the reward:
// a live completion bar, per-week wins, springy checks, mastery pips.
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, ExternalLink } from "lucide-react";
import { Page, Card, Btn, Chip, CountUp, Field, Empty, Meter, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { roadmapGenerator } from "../lib/roadmapGenerator.js";
import { JOBS } from "../data/jobs.js";
import {
  isCourseDone, isProjectDone, setQuestDone, getEvidence, setEvidence,
  completedSkillIdsForRole, masteryLevel,
} from "../lib/progress.js";
import { isEvidenceUrl } from "../lib/quests.js";
import { loadQuizBest } from "../data/quiz.js";

function QuestCheck({ done, onToggle, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        done ? "border-blurple bg-blurple" : "border-zinc-700 hover:border-zinc-500"
      }`}
    >
      {done && (
        <motion.span
          key="on"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
          className="flex"
        >
          <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
        </motion.span>
      )}
    </button>
  );
}

function MasteryPips({ level }) {
  if (level <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1" title={`Mastery ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full ${i <= level ? "bg-blurple" : "bg-zinc-800"}`}
          aria-hidden
        />
      ))}
      <span className="ml-1 font-mono text-[11px] tabular-nums text-zinc-500">Lv {level}</span>
    </span>
  );
}

export default function Quests() {
  const { role, resume } = useC2C();
  const [, bump] = useState(0);
  const missing = useMemo(() => resume?.result?.missing || [], [resume]);
  const weeks = useMemo(() => roadmapGenerator(missing, role, JOBS), [missing, role]);
  const quizBest = loadQuizBest(role);
  const refresh = () => bump((n) => n + 1);

  if (!resume) {
    return (
      <Page title="Quests" sub="Turn every missing skill into proof. Finish a week, unlock more roles.">
        <Empty
          title="No resume, no quests"
          body="Quests are built from the gaps in your resume. Score it once and your plan writes itself."
          action={<Btn to="/resume">Score your resume</Btn>}
        />
      </Page>
    );
  }

  if (!weeks.length) {
    return (
      <Page title="Quests" sub="Turn every missing skill into proof. Finish a week, unlock more roles.">
        <Empty
          title="Nothing missing. Seriously."
          body="Your resume covers this track end to end. New scores rebuild this plan if anything slips."
          action={<Btn to="/jobs">Browse eligible roles</Btn>}
        />
      </Page>
    );
  }

  const all = weeks.flatMap((w) => w.tasks.map((t) => ({ ...t, week: w.week })));
  const isDone = (t) =>
    t.link ? isCourseDone(role, t.skill) : isProjectDone(role, t.skill);
  const doneCount = all.filter(isDone).length;
  const pct = Math.round((doneCount / all.length) * 100);
  const verified = completedSkillIdsForRole(role).length;
  const finished = doneCount === all.length;

  return (
    <Page
      title="Quests"
      sub="Week 1 unlocks the most roles, so start there. Check things off — the bar moves with you."
    >
      <Card className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-bold tabular-nums text-zinc-50">
              <CountUp to={pct} />%
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {doneCount} of {all.length} done · {verified} skill{verified === 1 ? "" : "s"} verified
            </p>
          </div>
          {finished && <Chip tone="blurple">Plan complete</Chip>}
        </div>
        <div className="mt-3">
          <Meter value={doneCount} max={all.length} />
        </div>
      </Card>

      {finished && (
        <Card className="mb-4 border-blurple/40 bg-blurple/10">
          <p className="text-sm font-semibold text-zinc-100">Every gap closed. That is the whole game.</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Your proof links below are what recruiters actually open. Go get the interviews.
          </p>
          <Btn to="/jobs" size="sm" className="mt-3">Browse eligible roles</Btn>
        </Card>
      )}

      <div className="space-y-4">
        {weeks.map((w) => {
          const total = w.tasks.length;
          const done = w.tasks.filter((t) =>
            t.link ? isCourseDone(role, t.skill) : isProjectDone(role, t.skill)
          ).length;
          const weekDone = done === total;
          return (
            <Card key={w.week} className={weekDone ? "border-zinc-700" : ""}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-zinc-100">Week {w.week}</h2>
                {weekDone ? (
                  <Chip tone="blurple">Week complete</Chip>
                ) : (
                  <span className="font-mono text-xs tabular-nums text-zinc-500">{done}/{total}</span>
                )}
              </div>
              <ul className="divide-y divide-zinc-800">
                {w.tasks.map((t, i) => {
                  const kind = t.link ? "course" : "project";
                  const doneTask = kind === "course" ? isCourseDone(role, t.skill) : isProjectDone(role, t.skill);
                  const ev = kind === "project" ? getEvidence(role, t.skill) : "";
                  const level = masteryLevel(role, t.skill, quizBest);
                  const toggle = () => {
                    setQuestDone(role, t.skill, kind, !doneTask);
                    refresh();
                  };
                  return (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-2.5">
                        <QuestCheck done={doneTask} onToggle={toggle} label={t.text} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm leading-6 ${doneTask ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                            {t.text}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Chip tone={kind === "course" ? "blurple" : "zinc"}>
                              {kind === "course" ? "Course" : "Project"}
                            </Chip>
                            {t.link && (
                              <a
                                className="inline-flex items-center gap-1 text-xs font-medium text-blurple-soft underline"
                                href={t.link.u}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t.link.t} <ExternalLink className="size-3" aria-hidden />
                              </a>
                            )}
                            <MasteryPips level={level} />
                          </div>
                          {kind === "project" && !doneTask && (
                            <div className="mt-2">
                              <Field
                                label="Your proof link"
                                hint="Ship it, link it, check it off. This link is what unlocks the skill."
                              >
                                <input
                                  className={inputCls}
                                  defaultValue={ev}
                                  placeholder="https://github.com/you/project"
                                  onBlur={(e) => {
                                    const v = e.target.value.trim();
                                    if (!v) return;
                                    if (!isEvidenceUrl(v)) {
                                      e.target.setCustomValidity("That does not look like a project link.");
                                      e.target.reportValidity();
                                      e.target.setCustomValidity("");
                                      return;
                                    }
                                    setEvidence(role, t.skill, v);
                                    refresh();
                                  }}
                                />
                              </Field>
                            </div>
                          )}
                          {kind === "project" && doneTask && ev && (
                            <a
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blurple-soft underline"
                              href={ev}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View proof <ExternalLink className="size-3" aria-hidden />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
