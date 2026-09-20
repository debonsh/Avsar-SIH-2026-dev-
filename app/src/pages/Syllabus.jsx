// Syllabus: BAMS curriculum mapped to skills, NCISM competencies, quest progress.
import { useMemo } from "react";
import { Page, Card, H2, Btn, Chip, Meter, Empty } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { AYUSH_SYLLABUS } from "../data/ayushSeed.js";
import { completedSkillIdsForRole } from "../lib/progress.js";

function SemProgress({ sem }) {
  const done = completedSkillIdsForRole("ayush").filter((s) => sem.skills.includes(s)).length;
  const pct = Math.round((done / sem.skills.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <Meter value={done} max={sem.skills.length} />
      <span className="font-mono text-[11px] tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

export default function Syllabus() {
  const { role } = useC2C();
  const ayushDone = completedSkillIdsForRole("ayush");
  const totalSkills = AYUSH_SYLLABUS.reduce((a, s) => a + s.skills.length, 0);
  const totalDone = AYUSH_SYLLABUS.reduce((a, s) => a + s.skills.filter((sk) => ayushDone.includes(sk)).length, 0);
  const overallPct = Math.round((totalDone / totalSkills) * 100);

  if (role !== "ayush") {
    return (
      <Page title="Syllabus" sub="BAMS curriculum tracker. Switch to the Ayush Professional track to use this.">
        <Empty title="Not the ayush track" body="This page maps the BAMS semester syllabus to skills. Set your role to Ayush Professional on the Resume page." action={<Btn to="/resume">Switch to ayush</Btn>} />
      </Page>
    );
  }

  return (
    <Page title="Syllabus" sub="BAMS curriculum mapped to NCISM competencies. Each semester shows skills, courses, and quest progress." actions={
      <Btn to="/roadmap" variant="quiet">open roadmap →</Btn>
    }>
      <Card className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-bold tabular-nums text-zinc-50">
              {overallPct}%
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {totalDone} of {totalSkills} BAMS skills verified · 8 semesters + rotatory internship
            </p>
          </div>
          <Chip tone="sage">BAMS track</Chip>
        </div>
        <div className="mt-3">
          <Meter value={totalDone} max={totalSkills} />
        </div>
      </Card>

      <div className="space-y-3">
        {AYUSH_SYLLABUS.map((row) => (
          <Card key={row.sem} className={row.sem.startsWith("Sem 7") || row.sem.startsWith("Sem 8") ? "border-emerald-900/40" : ""}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-zinc-100">{row.sem}: {row.label}</h2>
                <SemProgress sem={row} />
              </div>
              <div className="flex gap-1.5">
                <Chip tone="blurple">{row.courses} courses</Chip>
                <Chip tone="sage">{row.quests} quests</Chip>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {row.skills.map((s) => {
                const done = ayushDone.includes(s);
                return (
                  <Chip key={s} tone={done ? "green" : "zinc"}>{s}{done ? " ✓" : ""}</Chip>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <H2>NCISM competency mapping</H2>
        <p className="mt-1 text-sm text-zinc-400">
          BAMS curriculum aligned to NCISM 2025 competency codes. Each skill in the syllabus
          maps to a documented competency: Dravyaguna (DC-01), Rognidan (DC-02),
          Panchakarma (DC-03), GMP (DC-04), HIMS (DC-05), Pharmacovigilance (DC-06),
          Research (DC-07), Sanskrit (DC-08).
        </p>
      </Card>
    </Page>
  );
}