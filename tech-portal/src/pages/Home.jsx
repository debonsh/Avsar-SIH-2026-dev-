// Avsar landing: composition only. Sections live in components/landing,
// primitives in components/ui.jsx. Data (ROWS/TRIO) stays here.
import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Chip, Reveal } from "../components/ui.jsx";
import LandingHero from "../components/landing/LandingHero.jsx";
import { PipelineFig, QuestFig, ScoreFig } from "../components/landing/Figs.jsx";
import { BootCta, ClanSim, CoachFig, ProblemStrip, Trio } from "../components/landing/Sections.jsx";

const ROWS = [
  {
    fig: "fig 01",
    title: "a score that shows its work",
    body: "five dimensions, every point traced to the exact resume line. no black box, no generic tips. just the three fixes worth your evening.",
    chips: ["resume breakdown", "line-level fixes", "skill chips"],
    to: "/resume",
    cta: "score my resume",
    Visual: ScoreFig,
  },
  {
    fig: "fig 02",
    title: "gaps become quests, quests become proof",
    body: "each missing skill turns into a free course plus a mini project. check them off, link your proof, watch the bar move and new roles unlock.",
    chips: ["free courses", "verified projects", "mastery levels"],
    to: "/quests",
    cta: "see how quests work",
    Visual: QuestFig,
  },
  {
    fig: "fig 03",
    title: "every application, one pipeline",
    body: "eligible roles unlock as your score grows. applied, interview, offer. your whole search in one view the placement cell can read too.",
    chips: ["eligibility match", "pipeline tracking", "csv export"],
    to: "/jobs",
    cta: "browse open roles",
    Visual: PipelineFig,
  },
  {
    fig: "fig 04",
    title: "a coach that knows your resume",
    body: "reviews, matches, and cover drafts grounded in your real gaps. offline answers instantly, ai upgrades when keyed. mentorship track included.",
    chips: ["offline-first", "resume-aware", "mentorship track"],
    to: "/?chat=1",
    cta: "open coach",
    Visual: CoachFig,
  },
];

const TRIO = [
  {
    title: "transparent by default",
    body: "the same scoring rubric for every student. if a number exists, you can see exactly how it was computed.",
  },
  {
    title: "proof over claims",
    body: "courses finish with a linked project, not a certificate pdf. recruiters open links. avsar collects them.",
  },
  {
    title: "offline-first, free forever",
    body: "your resume never leaves the device unless you sync it. students pay nothing, on any connection.",
  },
];

export default function Home() {
  const [palette, setPalette] = useState(
    () => localStorage.getItem("avsar-map-palette") || "harbor"
  );
  const pick = (p) => {
    setPalette(p);
    try {
      localStorage.setItem("avsar-map-palette", p);
    } catch {
      /* offline/private mode */
    }
  };
  return (
    <div>
      <LandingHero palette={palette} setPalette={pick} />

      {/* the gap, then principles */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16" aria-label="The gap">
        <Reveal>
          <ProblemStrip />
        </Reveal>
      </section>
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24" aria-label="Principles">
        <Trio items={TRIO} />
      </section>

      {/* alternating proof rows */}
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

      {/* simulated season board */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-label="Season board">
        <Reveal>
          <ClanSim />
        </Reveal>
      </section>

      {/* close */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14" aria-labelledby="cta">
        <BootCta />
      </section>
    </div>
  );
}
