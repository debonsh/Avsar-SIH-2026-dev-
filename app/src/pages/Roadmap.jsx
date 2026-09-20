// Roadmap: personalized ayush learning path with stages, resources, timeline.
import { useMemo } from "react";
import { Page, Card, H2, Btn, Chip, Meter, Empty } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { AYUSH_ROADMAP_STAGES } from "../data/ayushSeed.js";
import { completedSkillIdsForRole } from "../lib/progress.js";

function StageCard({ stage, done }) {
  const pct = Math.round((done / stage.skills.length) * 100);
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-zinc-100">{stage.label}</h3>
        <Chip tone={pct === 100 ? "green" : "blurple"}>{pct}%</Chip>
      </div>
      <Meter value={done} max={stage.skills.length} />
      <p className="mt-2 text-xs text-zinc-400">Provider: {stage.provider}</p>
      <p className="font-mono text-[11px] tabular-nums text-zinc-500">~{stage.hours} hrs</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {stage.skills.map((s) => (
          <Chip key={s} tone={done > 0 ? "green" : "zinc"} size="sm">{s}</Chip>
        ))}
      </div>
    </Card>
  );
}

export default function Roadmap() {
  const { role } = useC2C();
  const verified = completedSkillIdsForRole("ayush");

  if (role !== "ayush") {
    return (
      <Page title="Roadmap" sub="Personalized BAMS learning path. Switch to the Ayush Professional track to use this.">
        <Empty title="Not the ayush track" body="This page builds a personalized roadmap from your ayush skills. Set your role to Ayush Professional on the Resume page." action={<Btn to="/resume">Switch to ayush</Btn>} />
      </Page>
    );
  }

  const stages = useMemo(() => {
    return Object.entries(AYUSH_ROADMAP_STAGES).map(([key, stage]) => ({
      ...stage,
      key,
      done: stage.skills.filter((s) => verified.includes(s)).length,
    }));
  }, [verified]);

  const totalDone = stages.reduce((a, s) => a + s.done, 0);
  const totalSkills = stages.reduce((a, s) => a + s.skills.length, 0);
  const overallPct = Math.round((totalDone / totalSkills) * 100);

  return (
    <Page title="Roadmap" sub="Your personalized path from beej to acharya. Each stage closes a skill gap." actions={
      <Btn to="/quests" variant="quiet">open quests →</Btn>
    }>
      <Card className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-bold tabular-nums text-zinc-50">{overallPct}%</p>
            <p className="mt-1 text-sm text-zinc-400">{totalDone} of {totalSkills} skills closed across 4 stages</p>
          </div>
          <Chip tone="green">on track</Chip>
        </div>
        <div className="mt-3">
          <Meter value={totalDone} max={totalSkills} />
        </div>
      </Card>

      <div className="space-y-4">
        {stages.map((stage) => (
          <StageCard key={stage.key} stage={stage} done={stage.done} />
        ))}
      </div>

      <Card className="mt-6">
        <H2>Semester timeline</H2>
        <div className="mt-3 space-y-2">
          {[
            ["Sem 1–2", "Basic Sciences + Sanskrit"],
            ["Sem 3–4", "Rogganitas + Kriya Sharira"],
            ["Sem 5–6", "Ras Shastra + GMP"],
            ["Sem 7–8", "Rotatory Internship + Proof"],
          ].map(([period, desc]) => (
            <div key={period} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 px-4 py-2.5">
              <span className="font-mono text-xs text-blurple-soft">{period}</span>
              <span className="text-sm text-zinc-300">{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <H2>Resources</H2>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-400">
          <li>• SWAYAM — free cert courses (swayam.gov.in)</li>
          <li>• NCISM Competency Modules — ncismindia.org</li>
          <li>• CCRAS Research Orientation — ccras.nic.in</li>
          <li>• ABDM Digital Health — abdm.gov.in</li>
          <li>• RAV CME — ayush.gov.in</li>
        </ul>
      </Card>
    </Page>
  );
}