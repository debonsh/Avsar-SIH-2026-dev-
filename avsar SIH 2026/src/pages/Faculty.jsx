import { useMemo, useState } from "react";
import { Page, Card, Btn, Field, Chip, Badge, inputCls, cn } from "../components/ui.jsx";
import { RankBars } from "../components/charts.jsx";
import { FDPS, FDP_KINDS } from "../data/fdps.js";
import { loadInterests, toggleInterest, recordInterest } from "../lib/store.js";
import { bundledCorpus } from "../lib/corpus.js";
import { marketSignals } from "../lib/market.js";
import { programsForSkill } from "../lib/careerGps.js";

// What the department should teach next, from the same corpus that scores the students. A
// faculty desk that invented its own demand list would drift from the one the placement cell
// plans against, and the two would disagree in front of the same principal.
function CurriculumPanel() {
  const [lane, setLane] = useState("ayush");
  const corpus = useMemo(() => bundledCorpus(lane), [lane]);
  const signals = useMemo(() => marketSignals(corpus, { lane, limit: 8 }), [corpus, lane]);
  const uncovered = useMemo(
    () => signals.rows.filter((r) => programsForSkill(r.skill, lane).length === 0),
    [signals.rows, lane]
  );

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-zinc-100">Curriculum alignment</h2>
          <p className="text-xs leading-5 text-zinc-400">
            What this lane&rsquo;s employers are asking for, against what the department can already point students at.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5" role="group" aria-label="Curriculum lane">
          {[["ayush", "Ayush"], ["tech", "Tech"]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setLane(id)}
              aria-pressed={lane === id}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blurple",
                lane === id ? "bg-blurple text-white" : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone="zinc">{signals.sample.total} postings, {signals.sample.skilled} listing skills</Badge>
        <Badge tone={signals.sample.dated ? "zinc" : "amber"}>
          {signals.sample.dated ? `${signals.sample.dated} dated` : "no dated postings in this lane"}
        </Badge>
        <Badge tone={uncovered.length ? "amber" : "green"}>
          {uncovered.length ? `${uncovered.length} demanded skills have no course` : "every demanded skill has a course"}
        </Badge>
      </div>

      <RankBars
        rows={signals.rows.map((r) => ({
          key: r.skill,
          label: r.name,
          value: r.postings,
          valueSuffix: " postings",
          meta: `${programsForSkill(r.skill, lane).length ? `${programsForSkill(r.skill, lane)[0].title} · ${programsForSkill(r.skill, lane)[0].hours}h` : "nothing in the catalogue covers this"}`,
        }))}
        label={`Demanded skills in the ${lane} lane, largest first`}
        emptyNote="No skill clears the sample floor in this lane, so no curriculum claim is made."
      />

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Read this beside the district panel on the institute desk. Both read the same corpus, so a training batch and a
        syllabus change cannot be planned from two different pictures of the same market.
      </p>
    </Card>
  );
}

export default function Faculty() {
  const [kind, setKind] = useState("all");
  const [interested, setInterested] = useState(() => loadInterests());

  const list = FDPS.filter((f) => kind === "all" || f.kind === kind);

  function toggle(f) {
    setInterested(toggleInterest(f.id));
    recordInterest(f).catch(() => {});
  }

  return (
    <Page
      title="Faculty"
      sub="FDPs, research fellowships, consultancy, and workshops worth your semester break."
    >
      <CurriculumPanel />

      <Card className="mt-4">
        <Field label="Show">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">Everything ({FDPS.length})</option>
            {Object.entries(FDP_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </Card>

      <div className="mt-4 space-y-3">
        {list.map((f) => {
          const on = interested.includes(f.id);
          return (
            <Card key={f.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{f.title}</h3>
                  <p className="text-sm text-zinc-400">{f.org} · {f.loc}{f.deadline ? ` · apply by ${f.deadline}` : ""}</p>
                </div>
                <Chip tone={on ? "green" : "zinc"}>{FDP_KINDS[f.kind]}</Chip>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blurple px-4 py-2 text-sm font-medium text-white hover:bg-blurple-deep" href={f.url} target="_blank" rel="noreferrer">
                  Open official page
                </a>
                <Btn variant="quiet" onClick={() => toggle(f)}>
                  {on ? "Interested (saved)" : "Mark interested"}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
