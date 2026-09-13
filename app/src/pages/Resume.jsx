import { useMemo, useState } from "react";
import { Page, Card, H2, Btn, Field, Chip, Empty, Meter, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { ROLES, scoreResume, calculateMainScore, rankFor, rankRoles } from "../lib/score.js";
import { parseResumeFile, extractSections } from "../lib/parseResume.js";
import { SAMPLE_RESUME } from "../data/fixtures.js";
import { videosFor, resumeTips } from "../data/courses.js";
import { questPairsToProof } from "../lib/scores.js";
import { completedSkillIdsForRole } from "../lib/progress.js";
import { loadJSON } from "../lib/storage.js";

export default function Resume() {
  const { role, setRole, resume, saveResume } = useC2C();
  const [text, setText] = useState(() => resume?.text || "");
  const [notice, setNotice] = useState("");

  const result = resume?.result || null;
  const pairs = completedSkillIdsForRole(role).length;
  const proof = questPairsToProof(pairs);
  const interviewBest = loadJSON("c2c-interview-best", 0);
  const main = result ? calculateMainScore(result.total, interviewBest, proof, role) : 0;

  const bestFit = useMemo(() => (text.trim() ? rankRoles(text)[0] : null), [text]);
  const sections = useMemo(() => (result ? extractSections(resume.text) : []), [result, resume]);
  const tips = useMemo(() => (result ? resumeTips(result) : []), [result]);

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setText(await parseResumeFile(f));
      setNotice("");
    } catch {
      setNotice("Could not read that file. Paste the text instead.");
    }
    e.target.value = "";
  }

  function score() {
    if (!text.trim()) {
      setNotice("Paste your resume text or upload a file first.");
      return;
    }
    saveResume(text, scoreResume(text, role), role);
    setNotice("");
  }

  return (
    <Page
      title="Resume score"
      sub="Transparent ATS scoring: five dimensions, every point explained, nothing hidden."
      actions={result && <Btn to="/quests">Turn gaps into quests</Btn>}
    >
      <Card>
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <Field label="Target track">
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(ROLES).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Resume file (PDF or text)">
            <input type="file" accept=".pdf,.txt,.md" onChange={onFile} className="text-sm text-zinc-600" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Resume text">
            <textarea
              className={`${inputCls} min-h-44 font-mono text-xs`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume text here"
            />
          </Field>
        </div>
        {notice && <p className="mt-2 text-sm text-red-700">{notice}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn onClick={score}>Score my resume</Btn>
          <Btn variant="quiet" onClick={() => setText(SAMPLE_RESUME)}>Use a sample resume</Btn>
        </div>
        {bestFit && bestFit.key !== role && (
          <p className="mt-3 text-sm text-zinc-600">
            Best fit for this text looks like <strong>{bestFit.label}</strong> ({bestFit.total}/95).{" "}
            <button type="button" className="font-medium text-green-800 underline" onClick={() => setRole(bestFit.key)}>
              Switch track
            </button>
          </p>
        )}
      </Card>

      {!result && (
        <div className="mt-4">
          <Empty
            title="No score yet"
            body="Paste your resume above and press Score. Your result, gaps, and fixes appear here."
          />
        </div>
      )}

      {result && (
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <H2>Your score</H2>
            <p className="text-4xl font-semibold tabular-nums text-zinc-900">{main}<span className="text-lg text-zinc-400">/100</span></p>
            <p className="mt-1 text-sm text-zinc-500">Rank: <Chip tone="green">{rankFor(main)}</Chip></p>
            <p className="mt-1 text-xs text-zinc-500">ATS {result.total}/95 plus {pairs} quest-verified skill pairs and interview practice.</p>
            <div className="mt-4 space-y-3">
              {result.breakdown.map((d) => (
                <div key={d.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-zinc-700">{d.label}</span>
                    <span className="tabular-nums text-zinc-500">{d.pts}/{d.max}</span>
                  </div>
                  <Meter value={d.pts} max={d.max} />
                  <ul className="mt-1 space-y-0.5">
                    {d.why.map((w, i) => (
                      <li key={i} className="text-xs text-zinc-500">{w}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4 lg:col-span-3">
            <Card>
              <H2>Skills on your resume ({result.found.length})</H2>
              <div className="flex flex-wrap gap-1.5">
                {result.found.map((s) => <Chip key={s} tone="green">{s}</Chip>)}
                {result.found.length === 0 && <p className="text-sm text-zinc-500">None detected yet.</p>}
              </div>
              <H2 className="mt-4">Missing for this track ({result.missing.length})</H2>
              <div className="flex flex-wrap gap-1.5">
                {result.missing.map((s) => <Chip key={s} tone="amber">{s}</Chip>)}
                {result.missing.length === 0 && <p className="text-sm text-zinc-500">Nothing missing. Apply now.</p>}
              </div>
            </Card>

            <Card>
              <H2>Sections detected</H2>
              <div className="flex flex-wrap gap-1.5">
                {sections.map((s) => <Chip key={s.section}>{s.title}</Chip>)}
                {sections.length === 0 && <p className="text-sm text-zinc-500">No standard sections found. Add headers like Experience, Projects, Skills, Education.</p>}
              </div>
              {tips.length > 0 && (
                <>
                  <H2 className="mt-4">Fixes that raise this score</H2>
                  <ul className="space-y-1.5">
                    {tips.map((t, i) => <li key={i} className="text-sm text-zinc-600">{t}</li>)}
                  </ul>
                </>
              )}
            </Card>

            {result.missing.slice(0, 3).map((s) => {
              const vids = videosFor(s);
              if (!vids.length) return null;
              return (
                <Card key={s}>
                  <H2>Start {s} today</H2>
                  <ul className="space-y-1.5">
                    {vids.slice(0, 2).map((v, i) => (
                      <li key={i}>
                        <a className="text-sm font-medium text-green-800 underline" href={v.u} target="_blank" rel="noreferrer">{v.t}</a>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}
