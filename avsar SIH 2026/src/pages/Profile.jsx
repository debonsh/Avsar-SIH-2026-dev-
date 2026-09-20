import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Page, Card, H2, Btn, inputCls } from "../components/ui.jsx";
import { loadProfile, saveProfile } from "../lib/profile.js";
import { resetOnboarding } from "../lib/onboarding.js";
import { getUser, signInWithGoogle, signOut, onAuthChange, authLabel } from "../lib/auth.js";
import { getOrCreateC2CId } from "../lib/identity.js";
import { AYUSH_ROLE } from "../data/ayushSeed.js";

// Guided profile flow: 3 questions, one per screen, tap to answer.
// Finishing routes into the two things the portal is for: internships, then upskilling.
const GOALS = [
  { id: "internship", label: "Find an internship", hint: "Roles you can apply to right now, ranked by fit." },
  { id: "upskill", label: "Upskill first", hint: "Quests and free courses, jobs when you are ready." },
  { id: "certificate", label: "Earn a certificate", hint: "Free certs that lift your readiness score." },
  { id: "portfolio", label: "Build proof", hint: "Logbook links and a showcase hospitals open." },
];

const LOCS = [
  { id: "anywhere", label: "Anywhere", hint: "Includes remote and residential postings." },
  { id: "india", label: "In India", hint: "On-site roles across states." },
  { id: "remote", label: "Remote only", hint: "Work-from-hostel friendly roles." },
];

const HOURS = [
  { id: "2-4", label: "2 to 4 hrs/week", hint: "One quest at a time." },
  { id: "5-8", label: "5 to 8 hrs/week", hint: "Steady rotatory-side pace." },
  { id: "9+", label: "9+ hrs/week", hint: "Full sprint mode." },
];

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Intern"];

const LANES = [
  { id: "clinical", label: "Clinical practice", hint: "OPD, IPD, panchakarma rooms." },
  { id: "research", label: "Research", hint: "CCRAS, SPARK, trials." },
  { id: "industry", label: "Industry", hint: "GMP, QA, wellness brands." },
  { id: "exploring", label: "Still exploring", hint: "Matches stay broad." },
];

function isComplete(p) {
  return Boolean(p && p.skills && p.goal && p.loc && p.hours && p.year && p.lane);
}

function OptionCard({ selected, onPick, label, hint }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
        selected
          ? "border-emerald-600 bg-emerald-50 shadow-sm"
          : "border-stone-200 bg-white hover:border-emerald-400"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-stone-500">{hint}</span>}
      </span>
      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-emerald-600 bg-emerald-600" : "border-stone-300"}`} aria-hidden>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function Profile() {
  const stored = loadProfile();
  const [form, setForm] = useState(() => ({ track: "ayush", skills: "", year: "", lane: "", college: "", goal: "", loc: "", hours: "", ...(stored || {}) }));
  const [step, setStep] = useState(() => (isComplete(stored) ? "done" : 0));
  const reduce = useReducedMotion();
  const [skills, setSkills] = useState(() =>
    String(stored?.skills || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
  const [user, setUser] = useState(null);
  const [authMsg, setAuthMsg] = useState("");

  useEffect(() => {
    getUser().then(setUser).catch(() => {});
    onAuthChange(setUser);
  }, []);

  async function google() {
    const { error } = await signInWithGoogle();
    setAuthMsg(error || "redirecting to google…");
  }

  function set(id, v) {
    setForm((p) => ({ ...p, [id]: v }));
  }

  function toggleSkill(s) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].slice(0, 5)));
  }

  function saveAll(patch = {}) {
    const v = saveProfile({ ...form, skills: skills.join(", "), track: "ayush", ...patch });
    setForm({ ...form, skills: skills.join(", "), track: "ayush", ...patch, updatedAt: v.updatedAt });
    return v;
  }

  function finish() {
    saveAll();
    setStep("done");
  }

  function restart() {
    setStep(0);
  }

  const steps = ["Skills", "Background", "Goal", "Availability"];
  const stepAnim = reduce
    ? {}
    : { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.18, ease: "easeOut" } };

  return (
    <Page
      title={step === "done" ? "Your profile" : "Set up your profile"}
      sub={
        step === "done"
          ? "This tunes your internship matches and quest order. Stored on this device only."
          : "Four quick questions tune your internship matches. About a minute."
      }
    >
      {step !== "done" && (
        <ol className="mb-5 flex items-center gap-2" aria-label="Setup progress">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-emerald-600" : "bg-stone-200"}`} aria-hidden />
              <span className="sr-only">{label}{i <= step ? " done" : ""}</span>
            </li>
          ))}
        </ol>
      )}

      {step === 0 && (
        <motion.div key="step-0" {...stepAnim}>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Step 1 of 4</p>
          <h2 className="mt-1 font-display text-xl font-bold text-stone-900">Which of these do you already have?</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">Tap up to 5. These decide which internships show as eligible.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {AYUSH_ROLE.skills.map((s) => {
              const on = skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  aria-pressed={on}
                  className={`min-h-[40px] rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all active:scale-[0.97] ${
                    on
                      ? "border-emerald-600 bg-emerald-700 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-emerald-400"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Btn disabled={skills.length === 0} onClick={() => { saveAll(); setStep(1); }}>
              Continue{skills.length > 0 ? ` with ${skills.length}` : ""}
            </Btn>
            {!skills.length && <span className="text-xs text-stone-400">Pick at least one to continue</span>}
          </div>
        </Card>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div key="step-1" {...stepAnim}>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Step 2 of 4</p>
          <h2 className="mt-1 font-display text-xl font-bold text-stone-900">Where are you in BAMS?</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">Year sets which postings you can touch. Lane sharpens research and industry matches.</p>
          <p className="mb-2 mt-4 text-sm font-semibold text-stone-700">BAMS year</p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => {
              const on = form.year === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => set("year", y)}
                  aria-pressed={on}
                  className={`min-h-[40px] rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                    on
                      ? "border-emerald-600 bg-emerald-700 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-emerald-400"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
          <p className="mb-2 mt-5 text-sm font-semibold text-stone-700">Which lane pulls you most?</p>
          <div className="space-y-2">
            {LANES.map((l) => (
              <OptionCard key={l.id} label={l.label} hint={l.hint} selected={form.lane === l.id} onPick={() => set("lane", l.id)} />
            ))}
          </div>
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-semibold text-stone-700" htmlFor="college">
              College <span className="font-normal text-stone-400">(optional, improves local matches)</span>
            </label>
            <input
              id="college"
              className={inputCls}
              value={form.college || ""}
              onChange={(e) => set("college", e.target.value)}
              placeholder="Govt. Ayurveda College, Patna"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Btn disabled={!form.year || !form.lane} onClick={() => { saveAll(); setStep(2); }}>
              Continue
            </Btn>
            <button type="button" onClick={() => setStep(0)} className="text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-emerald-800">
              Back
            </button>
            {(!form.year || !form.lane) && <span className="text-xs text-stone-400">Pick a year and a lane</span>}
          </div>
        </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="step-2" {...stepAnim}>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Step 3 of 4</p>
          <h2 className="mt-1 font-display text-xl font-bold text-stone-900">What do you want most right now?</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">This picks your landing screen after setup.</p>
          <div className="mt-4 space-y-2">
            {GOALS.map((g) => (
              <OptionCard
                key={g.id}
                label={g.label}
                hint={g.hint}
                selected={form.goal === g.id}
                onPick={() => { set("goal", g.id); saveAll({ goal: g.id }); setStep(3); }}
              />
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className="mt-4 text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-emerald-800">
            Back
          </button>
        </Card>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="step-3" {...stepAnim}>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Step 4 of 4</p>
          <h2 className="mt-1 font-display text-xl font-bold text-stone-900">Where, and how much time?</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">Filters the feed and sizes your weekly quests.</p>
          <p className="mb-2 mt-4 text-sm font-semibold text-stone-700">Where can you work?</p>
          <div className="space-y-2">
            {LOCS.map((l) => (
              <OptionCard key={l.id} label={l.label} hint={l.hint} selected={form.loc === l.id} onPick={() => set("loc", l.id)} />
            ))}
          </div>
          <p className="mb-2 mt-5 text-sm font-semibold text-stone-700">Hours per week?</p>
          <div className="space-y-2">
            {HOURS.map((h) => (
              <OptionCard key={h.id} label={h.label} hint={h.hint} selected={form.hours === h.id} onPick={() => set("hours", h.id)} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Btn disabled={!form.loc || !form.hours} onClick={finish}>
              Finish setup
            </Btn>
            <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-emerald-800">
              Back
            </button>
            {(!form.loc || !form.hours) && <span className="text-xs text-stone-400">Pick one in each group</span>}
          </div>
        </Card>
        </motion.div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="grid gap-0 sm:grid-cols-[auto_1fr]">
              <div className="flex items-center gap-3 bg-emerald-700 px-5 py-4 text-white">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold" aria-hidden>
                  {String(form.skills || "").split(",").filter(Boolean).length}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Skills set</p>
                  <p className="text-sm font-medium">{GOALS.find((g) => g.id === form.goal)?.label || "Goal not set"}</p>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {String(form.skills || "").split(",").filter(Boolean).map((s) => (
                    <span key={s} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-900">{s.trim()}</span>
                  ))}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                  <div><dt className="text-stone-400">Year</dt><dd className="font-semibold text-stone-800">{form.year || "not set"}</dd></div>
                  <div><dt className="text-stone-400">Lane</dt><dd className="font-semibold capitalize text-stone-800">{form.lane || "not set"}</dd></div>
                  <div><dt className="text-stone-400">College</dt><dd className="truncate font-semibold text-stone-800">{form.college || "not set"}</dd></div>
                  <div><dt className="text-stone-400">Time</dt><dd className="font-semibold text-stone-800">{form.hours ? `${form.hours} hrs/week` : "not set"}</dd></div>
                </dl>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Profile 40% done. Resume (+30%) and interview (+30%) finish it — and shape your questions.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn to="/journey">Continue — add your resume</Btn>
                  <button type="button" onClick={restart} className="inline-flex min-h-[40px] items-center text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-emerald-800">
                    Edit answers
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (window.confirm("Clear saved profile, resume, and interview answers?")) { resetOnboarding(); window.location.reload(); } }}
                    className="inline-flex min-h-[40px] items-center text-sm font-medium text-stone-400 underline underline-offset-4 hover:text-red-600"
                  >
                    Clear everything
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <H2>Account</H2>
        <p className="font-mono text-xs text-zinc-500">device id: {getOrCreateC2CId()} · {authLabel()}</p>
        {user ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-zinc-200">{user.email}</span>
            <Btn variant="quiet" onClick={() => signOut().then(() => setUser(null))}>Sign out</Btn>
          </div>
        ) : (
          <div className="mt-3">
            <Btn variant="quiet" onClick={google}>Continue with Google</Btn>
            {authMsg && <p className="mt-2 font-mono text-xs text-zinc-500">{authMsg}</p>}
          </div>
        )}
      </Card>
    </Page>
  );
}
