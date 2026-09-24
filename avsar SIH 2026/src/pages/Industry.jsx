// Industry: post a role in 30 seconds. Offline-first like everything else —
// saves to the local feed instantly (custom jobs merge into /jobs), Supabase
// mirror rides along when configured. No login, no review queue for the prototype.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Page, Card, H2, Btn, Field, Chip, Empty, inputCls } from "../components/ui.jsx";
import { useAvsar } from "../app/store.jsx";
import { listApplicants } from "../lib/store.js";
import { matchJobPost, profileForMatching } from "../lib/match.js";
import { loadQuizBest } from "../data/quiz.js";
import { loadQAnswers, compileEvidence } from "../lib/questionnaire.js";
import { ROLES } from "../lib/score.js";
import { loadChallenges, saveChallenge } from "../lib/challenges.js";

const TYPES = {
  ayush: ["Internship", "Full-time", "Govt", "ministry", "research", "training"],
  tech: ["Internship", "Full-time", "Govt"],
};

const blank = { title: "", company: "", role: "ayush", loc: "Remote", type: "Internship", skills: "", minScore: 40, apply: "", description: "" };

// Attaching a challenge to a posting is the employer's half of proof-of-skill hiring. The
// checks field is required rather than optional on purpose: a challenge whose rubric is not
// written down is a challenge nobody can prepare for, which is the thing this replaces.
function PostChallenge({ isAyush }) {
  const [f, setF] = useState({ title: "", brief: "", skill: "", kind: "build", checks: "", threshold: 60 });
  const [notice, setNotice] = useState("");
  const [mine, setMine] = useState(() => loadChallenges().filter((c) => c.createdBy !== "seed"));

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const checks = f.checks.split(",").map((c) => c.trim()).filter(Boolean);
    if (!f.title.trim() || !f.brief.trim() || !f.skill.trim() || checks.length < 2) {
      setNotice("A title, a brief, a skill and at least two checks are needed. Two checks is the minimum for a candidate to know what is being looked for.");
      return;
    }
    saveChallenge({
      title: f.title,
      brief: f.brief,
      skill: f.skill.trim().toLowerCase(),
      kind: f.kind,
      checks,
      threshold: Number(f.threshold) || 60,
      lane: isAyush ? "ayush" : "tech",
      createdBy: "industry",
    });
    setMine(loadChallenges().filter((c) => c.createdBy !== "seed"));
    setF({ title: "", brief: "", skill: "", kind: "build", checks: "", threshold: 60 });
    setNotice("Challenge posted. It appears on the student proof-of-skill page for this lane, and submissions land in your blind shortlist.");
  }

  return (
    <Card className="mt-4">
      <H2>Attach a challenge to a role</H2>
      <p className="mb-3 text-xs leading-5 text-zinc-400">
        Instead of screening on a resume, ask for a small artifact. Grading is a published rubric rather than a model, and
        submissions reach you with a handle instead of a name.
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Challenge title">
          <input className={inputCls} value={f.title} onChange={set("title")} placeholder={isAyush ? "Write a suspected ADR report" : "Ship one page that survives a slow phone"} />
        </Field>
        <Field label="Which skill it proves" hint="A taxonomy id, so it links into the matcher.">
          <input className={inputCls} value={f.skill} onChange={set("skill")} placeholder={isAyush ? "pharmacovigilance" : "react"} />
        </Field>
        <Field label="Kind of evidence">
          <select className={inputCls} value={f.kind} onChange={set("kind")}>
            <option value="build">Build something</option>
            <option value="write">Written analysis</option>
            <option value="case-log">Case log</option>
            <option value="quiz">Short answer</option>
          </select>
        </Field>
        <Field label="Pass mark">
          <input className={inputCls} type="number" min="0" max="100" value={f.threshold} onChange={set("threshold")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Brief" hint="What to produce, and what would make it defensible.">
            <textarea className={`${inputCls} min-h-20`} value={f.brief} onChange={set("brief")} placeholder="Two or three sentences the candidate reads before starting." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Checks" hint="Comma separated. These are shown to the candidate and the coverage term counts how many they name.">
            <input className={inputCls} value={f.checks} onChange={set("checks")} placeholder={isAyush ? "suspect drug, timeline, seriousness" : "empty state, keyboard, responsive"} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Btn type="submit">Post challenge</Btn>
        </div>
      </form>
      {notice && <p className="mt-3 font-mono text-xs text-blurple-soft">{notice}</p>}
      {mine.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-800 border-t border-zinc-800 pt-2">
          {mine.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-xs">
              <span className="min-w-0 truncate text-zinc-200" title={c.title}>{c.title}</span>
              <span className="font-mono text-[10px] text-zinc-500">{c.skill} · pass {c.threshold}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Industry() {
  const { customJobs, addCustomJob, lane, resume } = useAvsar();
  const isAyush = lane === "ayush";
  const types = TYPES[lane] || TYPES.ayush;
  const [f, setF] = useState(() => ({ ...blank, role: lane || "ayush" }));
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);

  // same engine, recruiter side: this-device candidate scored with breakdown.
  const engineProfile = useMemo(() => {
    try {
      const found = resume?.result?.found || [];
      return profileForMatching(lane, found, loadQuizBest(lane), compileEvidence(loadQAnswers(lane)).claims);
    } catch {
      return { skills: [], levels: {}, verified: [], usedAt: {}, interests: [] };
    }
  }, [lane, resume]);
  const openJob = customJobs.find((j) => j.id === open) || null;
  const openFit = openJob ? matchJobPost(openJob, engineProfile) : null;

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function post(e) {
    e.preventDefault();
    if (!f.title.trim() || !f.company.trim()) {
      setErr("Title and company are the minimum. Everything else has defaults.");
      return;
    }
    const skills = f.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 8);
    const job = {
      id: `custom-${Date.now()}`,
      role: lane || f.role,
      title: f.title.trim(),
      company: f.company.trim(),
      loc: f.loc.trim() || "Remote",
      type: f.type,
      skills: skills.length ? skills : ["general"],
      minScore: Math.max(0, Math.min(95, Number(f.minScore) || 0)),
      apply: f.apply.trim() || "#",
      description: f.description.trim(),
    };
    addCustomJob(job);
    setF({ ...blank, role: lane || "ayush" });
    setErr("");
    setNotice(`Posted "${job.title}". It is live in the student feed now.`);
  }

  async function shortlist(job) {
    if (open === job.id) {
      setOpen(null);
      return;
    }
    setOpen(job.id);
    setLoading(true);
    try {
      setApplicants(await listApplicants(job.id));
    } catch {
      setApplicants([]);
    }
    setLoading(false);
  }

  return (
    <Page
      title={isAyush ? "For Hospitals & Industry" : "Post a role"}
      sub={
        isAyush
          ? "Post internships, rotatory slots, and entry-level vaidya roles with required skills. Students whose scores clear your bar see them as eligible."
          : "Post internships and entry-level tech roles with required skills. Students whose scores clear your bar see them as eligible."
      }
      actions={<Btn to="/jobs" variant="quiet">View student feed</Btn>}
    >
      {notice && <p className="mb-4 font-mono text-xs text-blurple-soft">{notice}</p>}
      {err && <p className="mb-4 font-mono text-xs text-red-400">{err}</p>}

      <Card>
        <H2>Post an opening</H2>
        <form onSubmit={post} className="grid gap-3 sm:grid-cols-2">
          <Field label="Role title">
            <input className={inputCls} value={f.title} onChange={set("title")} placeholder={isAyush ? "Panchakarma intern" : "Frontend intern"} />
          </Field>
          <Field label={isAyush ? "Hospital / company" : "Company"}>
            <input className={inputCls} value={f.company} onChange={set("company")} placeholder={isAyush ? "NABH Ayurveda Hospital" : "ZetaPay (Startup)"} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={f.type} onChange={set("type")}>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input className={inputCls} value={f.loc} onChange={set("loc")} placeholder={isAyush ? "Kochi / Pan India" : "Remote / Bangalore"} />
          </Field>
          <Field label="Minimum resume score" hint="Students below this see the role as locked.">
            <input className={inputCls} type="number" min="0" max="95" value={f.minScore} onChange={set("minScore")} />
          </Field>
          <Field label="Required skills" hint="Comma separated. Matching is literal against resume skills.">
            <input className={inputCls} value={f.skills} onChange={set("skills")} placeholder={(ROLES[lane]?.skills || []).slice(0, 3).join(", ") || "skills"} />
          </Field>
          <Field label="Apply link">
            <input className={inputCls} value={f.apply} onChange={set("apply")} placeholder="https://..." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="One-line brief">
              <textarea className={`${inputCls} min-h-20`} value={f.description} onChange={set("description")} placeholder="What the intern actually ships in 8 weeks" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Btn type="submit">Post opening</Btn>
          </div>
        </form>
      </Card>

      <PostChallenge isAyush={isAyush} />

      <div className="mt-4">
        <H2>Posted by you</H2>
        {customJobs.length === 0 ? (
          <Empty
            title="Nothing posted yet"
            body="Post your first role above. It lands in the student feed with eligibility computed live."
            action={<Link to="/jobs" className="font-mono text-xs text-blurple-soft underline underline-offset-4">Browse the feed →</Link>}
          />
        ) : (
          <div className="space-y-3">
            {customJobs.map((j) => (
              <Card key={j.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-mono text-sm font-medium text-zinc-100">{j.title}</h3>
                    <p className="font-mono text-xs text-zinc-500">{j.company} · {j.loc} · {j.type} · bar {j.minScore}</p>
                  </div>
                  <Chip tone="green">live in feed</Chip>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(j.skills || []).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn variant="quiet" size="sm" onClick={() => shortlist(j)}>
                    {open === j.id ? "hide shortlist" : "shortlist"}
                  </Btn>
                  <Link to="/jobs" className="inline-flex min-h-[44px] items-center font-mono text-xs text-blurple-soft underline underline-offset-4">
                    View in feed →
                  </Link>
                </div>
                {open === j.id && (
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                      applicants · ranked by score
                    </p>
                    {openFit && (
                      <div className="mt-2 border-l-2 border-emerald-500 py-1 pl-3">
                        <p className="font-mono text-xs text-zinc-100">
                          This-device candidate: {openFit.score}/100 · {openFit.band}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {openFit.why.map((w, i) => (
                            <li key={i} className="font-mono text-[11px] leading-5 text-zinc-400">· {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {loading ? (
                      <p className="mt-2 font-mono text-xs text-zinc-500">reading applications…</p>
                    ) : applicants.length === 0 ? (
                      <p className="mt-2 font-mono text-xs text-zinc-500">
                        no applications yet. students apply from the feed; remote rows appear when supabase is keyed.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {applicants.map((a, i) => (
                          <li key={`${a.student}-${i}`} className="flex items-center justify-between gap-2 font-mono text-xs">
                            <span className="truncate text-zinc-400">
                              <span className="text-zinc-600">0{i + 1}</span> {a.student}
                              {a.local ? "" : " · remote"}
                            </span>
                            <span className="shrink-0 tabular-nums text-zinc-200">{a.score}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
