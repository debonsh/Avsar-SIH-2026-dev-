// Programs: the collaboration layer's student side — learning programs,
// workshops, mentorships, innovation challenges. Enrollments persist locally;
// "closes your gaps" ranks programs against your live gap vector.
import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Chip, Empty } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { PROGRAMS, PROGRAM_KINDS, programsFor } from "../data/programs.js";
import { gapVector } from "../data/taxonomy.js";
import { profileForMatching } from "../lib/match.js";
import { loadQuizBest } from "../data/quiz.js";
import { loadEnrollments, toggleEnrollment } from "../lib/store.js";

const KINDS = ["all", "program", "workshop", "mentorship", "challenge"];

export default function Programs() {
  const { role, resume } = useC2C();
  const [kind, setKind] = useState("all");
  const [enrolled, setEnrolled] = useState(() => loadEnrollments());
  const found = useMemo(() => resume?.result?.found || [], [resume]);
  const quizBest = loadQuizBest(role);

  const held = useMemo(() => {
    const p = profileForMatching(role, found, quizBest);
    const levels = {};
    for (const s of p.skills) levels[s] = p.levels[s];
    return levels;
  }, [role, found, quizBest]);

  const gaps = useMemo(() => gapVector("ayush-cra", held).slice(0, 3), [held]);
  const recIds = useMemo(() => {
    const ids = [];
    for (const g of gaps) for (const p of programsFor(g.skill)) if (!ids.includes(p.id)) ids.push(p.id);
    return ids.slice(0, 4);
  }, [gaps]);

  const list = PROGRAMS.filter((p) => kind === "all" || p.kind === kind);

  function toggle(id) {
    setEnrolled(toggleEnrollment(id));
  }

  return (
    <Page
      title="Programs"
      sub="Industry learning programs, workshops, mentorships, and innovation challenges — each tagged with the skill gap it closes. Providers are hand-verified; links never AI-invented."
    >
      {recIds.length > 0 && (
        <Card className="border-emerald-200">
          <H2>Closes your gaps first</H2>
          <ul className="space-y-2">
            {recIds.map((id) => {
              const p = PROGRAMS.find((x) => x.id === id);
              if (!p) return null;
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-stone-800">{p.title} <span className="font-normal text-stone-500">· {p.provider}</span></span>
                  <Btn size="sm" variant={enrolled.includes(id) ? "quiet" : "primary"} onClick={() => toggle(id)}>
                    {enrolled.includes(id) ? "Enrolled ✓" : "Enroll"}
                  </Btn>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="mb-4 mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Program kinds">
        {KINDS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              kind === k ? "bg-emerald-700 text-white" : "border border-emerald-200 bg-white text-emerald-900 hover:border-emerald-400"
            }`}
          >
            {k === "all" ? `All (${PROGRAMS.length})` : `${PROGRAM_KINDS[k]}s`}
          </button>
        ))}
      </div>

      {list.length === 0 && <Empty title="Nothing here yet" body="No programs of this kind are listed right now." />}
      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-stone-900">{p.title}</h3>
                <p className="mt-0.5 text-[13px] text-stone-500">{p.provider}{p.mode ? ` · ${p.mode}` : ""}{p.hours ? ` · ~${p.hours} hrs` : ""}{p.stipend ? ` · ${p.stipend}` : ""}{p.deadline ? ` · ${p.deadline}` : ""}</p>
                {p.note && <p className="mt-1 text-xs leading-5 text-stone-500">{p.note}</p>}
              </div>
              <Chip tone="green">{PROGRAM_KINDS[p.kind]}</Chip>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
              {p.cert && <Chip tone="blue">certificate</Chip>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Btn size="sm" variant={enrolled.includes(p.id) ? "quiet" : "primary"} onClick={() => toggle(p.id)}>
                {enrolled.includes(p.id) ? "Enrolled ✓ — tap to leave" : "Enroll"}
              </Btn>
              <a className="inline-flex min-h-[32px] items-center text-xs font-semibold text-emerald-700 underline underline-offset-4" href={p.url} target="_blank" rel="noreferrer">
                Provider site ↗
              </a>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
