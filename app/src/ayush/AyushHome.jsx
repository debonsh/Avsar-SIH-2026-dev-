// [ayush] portal home. ncism dna: masthead, ticker, quick links, tables.
// engine reused read-only (store, progress, seed). tech portal untouched.
import { Link, useNavigate } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { Btn, Reveal, Ticket } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import Masthead from "./Masthead.jsx";
import { AYUSH_JOBS, AYUSH_TREE } from "./seed.js";
import { AYUSH_FEED_JOBS } from "./feed.js";
import { AYUSH_PROGRAMS, ayushStats, AYUSH_SCHEMES, AYUSH_FAQ } from "./data.js";
import { AYUSH_FEED_AT } from "./feed.js";
import { AYUSH_NEWS, AYUSH_NEWS_AT } from "./news.js";
import { completedSkillIdsForRole, getEvidence, isCourseDone, isProjectDone } from "../lib/progress.js";

const ROTATORY = [
  { span: "months 1-6", where: "college ayurveda hospital", what: "opd/ipd, panchakarma, case sheets, pharmacovigilance" },
  { span: "months 7-12", where: "phc / chc / rural / district hospital", what: "national health programmes, community care, e-logbook" },
];

const QUICK = [
  { to: "/ayush/assess", t: "ai assessment", d: "resume in, custom questions out" },
  { to: "/ayush/roles", t: "ayush roles", d: "internships + jobs, fit-ranked", ayush: true },
  { to: "/quests", t: "shishiksha quests", d: "orientation checklist + proof", ayush: true },
  { to: "/ayush/colleges", t: "colleges", d: "permitted bams seats 25-26" },
  { to: "/faculty", t: "fdps + consultancy", d: "rav cmes, immersion seats" },
  { to: "/industry", t: "post a role", d: "as an ayush recruiter" },
];

export default function AyushHome() {
  const { setRole } = useC2C();
  const nav = useNavigate();

  const enter = (to, preset = true) => {
    if (preset) setRole("ayush");
    nav(to);
  };

  const shishiksha = AYUSH_TREE.ayush.branches[1].skills.find((s) => s.id === "shishiksha");
  const checks = [
    { t: "orientation course done", done: isCourseDone("ayush", "shishiksha") },
    { t: "6-day checklist project done", done: isProjectDone("ayush", "shishiksha") },
    { t: "proof link attached", done: Boolean(getEvidence("ayush", "shishiksha")) },
  ];
  const logbook = completedSkillIdsForRole("ayush").filter((s) => getEvidence("ayush", s)).length;
  const liveRoles = [...AYUSH_JOBS, ...AYUSH_FEED_JOBS];
  const stats = ayushStats(liveRoles);

  return (
    <div className="ayush-light bg-[#f4f4f4] pb-4 text-zinc-900">
      <Masthead />

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6" aria-label="Ayush hero">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{"// vaidya track"}</p>
        <h1 className="mt-3 max-w-3xl text-balance font-mono text-4xl font-normal leading-[1.08] text-zinc-50 sm:text-6xl">
          <span className="text-emerald-300">{">"} </span>
          classroom to clinic, with proof.
          <span className="cursor-blink" aria-hidden />
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-zinc-400">
          score your bams resume, clear the shishiksha orientation checklist, and
          apply to ayush internships through one tracked pipeline.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Btn size="lg" className="rounded-none" onClick={() => enter("/resume")}>
            [enter as bams student] <ArrowRight aria-hidden />
          </Btn>
            <button
              type="button"
              onClick={() => enter("/ayush/roles")}
              className="font-mono text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-200"
            >
              or browse {liveRoles.length} ayush roles →
            </button>
            </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6" aria-label="Quick links">
        <div className="grid gap-2 sm:grid-cols-3">
          {QUICK.map((q) => (
            <button
              key={q.t}
              type="button"
              onClick={() => (q.ayush ? enter(q.to) : nav(q.to))}
              className="border border-zinc-800 bg-zinc-950 px-4 py-3 text-left hover:border-zinc-600"
            >
              <p className="font-mono text-sm text-zinc-100">[{q.t}]</p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{q.d}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6" aria-label="Stats">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="border border-zinc-800 bg-zinc-950 px-4 py-3">
              <p className="font-mono text-2xl tabular-nums text-zinc-50">{s.v}</p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{s.k}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6" aria-label="How it works">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{"// kaise kaam karta hai"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["1 · score", "paste your resume. get one honest number + 3 fixes."],
            ["2 · quest", "close each gap with a free course + proof link."],
            ["3 · apply", "fit-ranked roles. one click applies, pipeline tracks."],
          ].map(([t, d]) => (
            <div key={t} className="border border-zinc-800 bg-zinc-950 px-4 py-4">
              <p className="font-mono text-sm text-emerald-300">{t}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-300">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6" aria-label="Schemes">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{"// sarkari yojanaen"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {AYUSH_SCHEMES.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="border border-zinc-800 bg-zinc-950 px-4 py-4 hover:border-zinc-600">
              <p className="font-mono text-sm text-zinc-100">{s.t} <span className="text-zinc-500">{s.hi}</span></p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{s.d}</p>
              <p className="mt-1 font-mono text-[11px] text-sage">who: {s.who} →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6" aria-label="Rotatory tracker">
        <Reveal>
          <Ticket label="fig.a1 // rotatory internship" status="12 months · ncism">
            <ul className="space-y-3">
              {ROTATORY.map((r) => (
                <li key={r.span} className="border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-blurple-soft">{r.span}</p>
                  <p className="mt-1 font-mono text-sm text-zinc-100">{r.where}</p>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-500">{r.what}</p>
                </li>
              ))}
            </ul>
          </Ticket>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6" aria-label="Orientation checklist">
        <Reveal>
          <Ticket label="fig.a2 // shishiksha checklist" status={checks.every((c) => c.done) ? "complete" : "open"}>
            <p className="text-sm text-zinc-300">{shishiksha.name}: {shishiksha.course.t}</p>
            <ul className="mt-3 space-y-1.5">
              {checks.map((c) => (
                <li key={c.t} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center border ${c.done ? "border-emerald-500 bg-emerald-600" : "border-zinc-700"}`}
                    aria-hidden
                  >
                    {c.done && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={c.done ? "text-zinc-500 line-through" : "text-zinc-200"}>{c.t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-xs tabular-nums text-zinc-500">e-logbook entries with proof: {logbook}</p>
            <div className="mt-4">
              <Btn variant="quiet" className="rounded-none" onClick={() => enter("/quests")}>[continue checklist]</Btn>
            </div>
          </Ticket>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6" aria-label="Programs">
        <Reveal>
          <Ticket label="fig.a3 // research + industry programs" status={`${AYUSH_PROGRAMS.length} open`}>
            <ul className="divide-y divide-zinc-800">
              {AYUSH_PROGRAMS.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-mono text-sm text-zinc-100">{p.title}</p>
                    <p className="font-mono text-[11px] text-zinc-500">{p.org} · {p.loc} · {p.kind}</p>
                  </div>
                  <a href={p.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-blurple-soft underline underline-offset-4">
                    official page →
                  </a>
                </li>
              ))}
            </ul>
          </Ticket>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6" aria-label="Questions">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{"// poochhe jaane wale sawaal"}</p>
        <div className="mt-3 divide-y divide-zinc-800 border border-zinc-800 bg-zinc-950">
          {AYUSH_FAQ.map((f) => (
            <details key={f.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-mono text-sm text-zinc-100 hover:text-white">
                <span className="mr-2 text-blurple-soft group-open:hidden">+</span>
                <span className="mr-2 hidden text-blurple-soft group-open:inline">−</span>
                {f.q}
              </summary>
              <p className="mt-1.5 pl-5 text-sm leading-6 text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6" aria-label="Official links">
        <div className="grid gap-2 border-t border-zinc-800 pt-6 sm:grid-cols-4">
          {[
            ["ncism", "permissions · colleges", "https://ncismindia.org/"],
            ["ministry of ayush", "schemes · internship", "https://ayush.gov.in/"],
            ["ccras", "research · vacancies", "https://ccras.nic.in/"],
            ["nmpb", "medicinal plants", "https://www.nmpb.nic.in/"],
          ].map(([t, d, u]) => (
            <a key={t} href={u} target="_blank" rel="noreferrer" className="border border-zinc-800 bg-zinc-950 px-4 py-3 hover:border-zinc-600">
              <p className="font-mono text-xs text-zinc-100">[{t}]</p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{d}</p>
            </a>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-zinc-600">{"// external official sources. verify before counselling or travelling."}</p>
      </section>

      {/* live news strip */}
      {AYUSH_NEWS.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6" aria-label="Live news">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">{"// live news"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AYUSH_NEWS.slice(0, 6).map((n) => (
              <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
                <span className="font-mono text-[10px] text-zinc-500">[{n.src}]</span> {n.title}
              </a>
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-zinc-700">news feed: {AYUSH_NEWS_AT} · npm run ayush:news</p>
        </section>
      )}

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6" aria-label="Ananya">
        <Reveal>
          <div className="border border-emerald-900 bg-zinc-950 px-6 py-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">{"// ananya · bams final year"}</p>
            <p className="mx-auto mt-3 max-w-xl text-pretty font-mono text-sm leading-6 text-zinc-300">
              scored 44. missing gcp documentation. strong in dravyaguna.
              cleared shishiksha, applied at 87% fit, mentor signed off,
              pharmacovigilance flipped to proof.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4">
              <Btn size="lg" className="rounded-none" onClick={() => enter("/resume")}>
                [run her path] <ArrowRight aria-hidden />
              </Btn>
              <Link to="/tech" className="inline-flex items-center font-mono text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-200">
                tech portal →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
