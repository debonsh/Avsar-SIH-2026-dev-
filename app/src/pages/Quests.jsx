import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Empty, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { roadmapGenerator } from "../lib/roadmapGenerator.js";
import { JOBS } from "../data/jobs.js";
import {
  isCourseDone, isProjectDone, setQuestDone, getEvidence, setEvidence,
  completedSkillIdsForRole, masteryLevel,
} from "../lib/progress.js";
import { isEvidenceUrl } from "../lib/quests.js";
import { loadQuizBest } from "../data/quiz.js";

export default function Quests() {
  const { role, resume } = useC2C();
  const [, bump] = useState(0);
  const missing = useMemo(() => resume?.result?.missing || [], [resume]);
  const weeks = useMemo(() => roadmapGenerator(missing, role, JOBS), [missing, role]);
  const doneCount = completedSkillIdsForRole(role).length;
  const refresh = () => bump((n) => n + 1);

  if (!resume) {
    return (
      <Page title="Quests" sub="Each missing skill becomes a course plus a mini project with proof.">
        <Empty
          title="Score first, quest after"
          body="Quests are built from your missing skills, which appear after you score a resume."
          action={<Btn to="/resume">Score your resume</Btn>}
        />
      </Page>
    );
  }

  if (!weeks.length) {
    return (
      <Page title="Quests" sub="Each missing skill becomes a course plus a mini project with proof.">
        <Empty
          title="No gaps left"
          body="Your resume covers every skill for this track. New scores rebuild this plan automatically."
          action={<Btn to="/jobs">Browse eligible roles</Btn>}
        />
      </Page>
    );
  }

  return (
    <Page
      title="Quests"
      sub={`${doneCount} skill${doneCount === 1 ? "" : "s"} verified. Weeks are ordered by employer demand, so week 1 unlocks the most roles.`}
    >
      <div className="space-y-4">
        {weeks.map((w) => (
          <Card key={w.week}>
            <H2>Week {w.week}</H2>
            <ul className="space-y-3">
              {w.tasks.map((t, i) => {
                const kind = t.link ? "course" : "project";
                const done = kind === "course" ? isCourseDone(role, t.skill) : isProjectDone(role, t.skill);
                const ev = kind === "project" ? getEvidence(role, t.skill) : "";
                const level = masteryLevel(role, t.skill, loadQuizBest(role));
                return (
                  <li key={i} className="rounded-lg border border-zinc-100 p-3">
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-green-700"
                        checked={done}
                        onChange={(e) => { setQuestDone(role, t.skill, kind, e.target.checked); refresh(); }}
                      />
                      <span className={`text-sm ${done ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{t.text}</span>
                    </label>
                    <div className="ml-6 mt-1 flex flex-wrap items-center gap-2">
                      {t.link && (
                        <a className="text-xs font-medium text-green-800 underline" href={t.link.u} target="_blank" rel="noreferrer">
                          {t.link.t}
                        </a>
                      )}
                      {level > 0 && <span className="text-xs text-zinc-500">Mastery level {level}/3</span>}
                    </div>
                    {kind === "project" && (
                      <div className="ml-6 mt-2">
                        <Field label="Proof link (GitHub, demo, or writeup)">
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
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </Page>
  );
}
