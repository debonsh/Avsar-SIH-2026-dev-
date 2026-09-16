// Avsar landing. Skeleton stolen from Linear with love: centered hero, product UI
// full-bleed in a window frame, alternating proof rows, text-only trio, changelog
// energy in the close. Bricolage display, Inter body, mono for data only.
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Btn, Chip, CountUp, Meter, Reveal } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";

function WindowFrame({ url, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-zinc-700" />
          <i className="size-2.5 rounded-full bg-zinc-700" />
          <i className="size-2.5 rounded-full bg-zinc-700" />
        </span>
        <span className="mx-auto hidden rounded-md bg-zinc-900 px-3 py-0.5 font-mono text-[11px] text-zinc-500 sm:block">
          {url}
        </span>
        <span className="ml-auto rounded border border-blurple/40 bg-blurple/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blurple-soft sm:ml-0">
          Preview
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function ScoreWindow() {
  const rows = [
    { label: "Skills match", value: 82 },
    { label: "Experience", value: 64 },
    { label: "Projects", value: 71 },
    { label: "Education", value: 90 },
  ];
  const fixes = ["Add numbers to 2 project bullets", "Name the missing skill: REST APIs", "Move GitHub above Education"];
  return (
    <WindowFrame url="avsar.app/resume">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">ATS score</p>
          <p className="mt-1 font-display text-5xl font-bold tabular-nums text-zinc-50">
            <CountUp to={72} />
            <span className="text-lg text-zinc-500">/100</span>
          </p>
          <div className="mt-4 space-y-2.5">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{r.label}</span>
                  <span className="font-mono tabular-nums text-zinc-500">{r.value}</span>
                </div>
                <Meter value={r.value} max={100} />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">3 fixes that raise it</p>
          <ul className="mt-3 space-y-2.5">
            {fixes.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm leading-6 text-zinc-200">
                <Check className="mt-1 size-4 shrink-0 text-blurple-soft" strokeWidth={3} aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["React", "REST APIs", "SQL"].map((s) => (
              <Chip key={s} tone={s === "REST APIs" ? "amber" : "green"}>{s}</Chip>
            ))}
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

function QuestWindow() {
  const items = [
    { t: "Finish the REST APIs course", done: true },
    { t: "Ship a CRUD mini project", done: true },
    { t: "Add proof link to portfolio", done: false },
  ];
  return (
    <WindowFrame url="avsar.app/quests">
      <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">Week 1 · 2/3 done</p>
      <div className="mt-2">
        <Meter value={2} max={3} />
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((i) => (
          <li key={i.t} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                i.done ? "border-blurple bg-blurple" : "border-zinc-700"
              }`}
              aria-hidden
            >
              {i.done && <Check className="size-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className={i.done ? "text-zinc-500 line-through" : "text-zinc-200"}>{i.t}</span>
          </li>
        ))}
      </ul>
    </WindowFrame>
  );
}

function PipelineWindow() {
  const cols = [
    { h: "Applied", items: ["Frontend Intern · Zeta", "SDE Trainee · TCS"] },
    { h: "Interview", items: ["Web Intern · Razorpay"] },
    { h: "Offer", items: [] },
  ];
  return (
    <WindowFrame url="avsar.app/jobs">
      <div className="grid gap-3 sm:grid-cols-3">
        {cols.map((c) => (
          <div key={c.h}>
            <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">
              {c.h} · {c.items.length}
            </p>
            <div className="mt-2 space-y-2">
              {c.items.map((j) => (
                <p key={j} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs leading-5 text-zinc-200">
                  {j}
                </p>
              ))}
              {c.items.length === 0 && (
                <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs text-zinc-600">
                  Nothing here yet
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </WindowFrame>
  );
}

const ROWS = [
  {
    fig: "Fig 01",
    title: "A score that shows its work",
    body: "Five dimensions, every point traced to the exact resume line. No black box, no generic tips — just the three fixes worth your evening.",
    chips: ["ATS breakdown", "Line-level fixes", "Skill chips"],
    to: "/resume",
    cta: "Score my resume",
    Visual: ScoreWindow,
  },
  {
    fig: "Fig 02",
    title: "Gaps become quests, quests become proof",
    body: "Each missing skill turns into a free course plus a mini project. Check them off, link your proof, watch the bar move and new roles unlock.",
    chips: ["Free courses", "Verified projects", "Mastery levels"],
    to: "/quests",
    cta: "See how quests work",
    Visual: QuestWindow,
  },
  {
    fig: "Fig 03",
    title: "Every application, one pipeline",
    body: "Eligible roles unlock as your score grows. Applied, interview, offer — your whole search in one view the placement cell can read too.",
    chips: ["Eligibility match", "Pipeline tracking", "CSV export"],
    to: "/jobs",
    cta: "Browse open roles",
    Visual: PipelineWindow,
  },
];

const TRIO = [
  {
    title: "Transparent by default",
    body: "The same scoring rubric for every student. If a number exists, you can see exactly how it was computed.",
  },
  {
    title: "Proof over claims",
    body: "Courses finish with a linked project, not a certificate PDF. Recruiters open links; Avsar collects them.",
  },
  {
    title: "Offline-first, free forever",
    body: "Your resume never leaves the device unless you sync it. Students pay nothing, on any connection.",
  },
];

function NextStep() {
  const { resume, events } = useC2C();
  const step = !resume
    ? { n: "Step 1", text: "score your resume", to: "/resume" }
    : (events?.length || 0) === 0
      ? { n: "Step 2", text: "close your first gap", to: "/quests" }
      : { n: "Step 3", text: "track an application", to: "/jobs" };
  return (
    <p className="mt-6 font-mono text-xs tabular-nums text-zinc-500">
      {step.n}:{" "}
      <Link to={step.to} className="text-blurple-soft underline underline-offset-4 hover:text-zinc-100">
        {step.text} →
      </Link>
    </p>
  );
}

export default function Home() {
  return (
    <div>
      {/* Centered hero over dither */}
      <section className="relative overflow-hidden">
        <div className="bg-dither mask-hero-fade pointer-events-none absolute inset-0" aria-hidden />
        <div className="bg-dither-blurple mask-hero-fade pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <p className="inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-400">
              Free for students · No account needed
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-balance font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-zinc-50 sm:text-7xl">
              Your degree, translated into an offer letter.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-zinc-400">
              Score your resume in plain language, close each gap with a free course and a verified
              project, and track every application in one pipeline.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Btn to="/resume" size="lg">
                Score your resume <ArrowRight aria-hidden />
              </Btn>
              <Btn to="/jobs" variant="quiet" size="lg">
                Browse open roles
              </Btn>
            </div>
            <NextStep />
          </motion.div>

          <motion.div
            className="relative mt-12 text-left sm:mt-16"
            initial={{ opacity: 0, transform: "translateY(24px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
          >
            <div
              className="pointer-events-none absolute -inset-x-8 top-8 bottom-0 bg-blurple/15 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <ScoreWindow />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Text-only trio */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24" aria-label="Principles">
        <div className="grid gap-8 border-t border-zinc-800 pt-10 sm:grid-cols-3 sm:gap-6">
          {TRIO.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.06}>
              <h2 className="font-display text-lg font-bold text-zinc-50">{t.title}</h2>
              <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-zinc-400">{t.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Alternating proof rows */}
      {ROWS.map((r, i) => (
        <section key={r.fig} className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-label={r.title}>
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <Reveal className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
              <p className="font-mono text-xs tabular-nums text-blurple-soft">{r.fig}</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-[-0.02em] text-zinc-50 sm:text-4xl">
                {r.title}
              </h2>
              <p className="mt-3 max-w-md text-pretty text-[15px] leading-7 text-zinc-400">{r.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {r.chips.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
              <Link
                to={r.to}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blurple-soft hover:text-zinc-100"
              >
                {r.cta} <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={0.08}>
              <r.Visual />
            </Reveal>
          </div>
        </section>
      ))}

      {/* Close */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14" aria-labelledby="cta">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-blurple px-6 py-12 text-center sm:py-16">
            <div className="bg-dither pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="relative">
              <h2
                id="cta"
                className="mx-auto max-w-lg text-balance font-display text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
              >
                Your next opportunity starts with one honest score.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-7 text-white/80">
                One evening: score, one quest, one application tracked. That is the whole onboarding.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                <Btn to="/resume" size="lg" className="bg-white text-blurple-deep hover:bg-zinc-100">
                  Score your resume <ArrowRight aria-hidden />
                </Btn>
                <Btn
                  to="/quests"
                  variant="quiet"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white"
                >
                  Close your gaps
                </Btn>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
