// ponytail: static hero + live sample proof (computed, not hardcoded), no new deps
import { ArrowRight, ShieldCheck } from "lucide-react";
import { scoreResume } from "../lib/score";
import { matchJobs } from "../data/jobs";
import { SAMPLE_RESUME } from "../data/fixtures";
import { Badge, Button, Card } from "./ui";
import { FadeUp, Lift, TextReveal } from "./amicro";

const SAMPLE = scoreResume(SAMPLE_RESUME, "sde");
const ELIGIBLE = matchJobs("sde", SAMPLE.total, SAMPLE.found).filter((j) => j.eligible).length;

// the real funnel, in the app's own order: Role, Upload, Score, Fix
const FUNNEL = [
  { title: "Pick a target role", desc: "Four tracks. Paste your resume and take the suggested fit." },
  { title: "Upload your resume", desc: "PDF parsed in your browser. The file is never stored." },
  { title: "Get your number", desc: "One ATS score with every point explained." },
  { title: "Fix gaps and apply", desc: "Free links per gap. Jobs open as your score earns them." },
];

export default function Landing({ go }) {
  return (
    <div>
      <FadeUp>
        <div className="text-center pt-8 pb-6">
          <Badge tone="emerald">Built for Tier-2 / Tier-3 students</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4">
            <TextReveal text="From campus to corporate, with proof." />
          </h1>
          <p className="text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
            Upload your resume, get a transparent ATS score with every point explained,
            close gaps with free courses, and unlock jobs your score earns.
          </p>
          <div className="flex gap-2 justify-center mt-5 flex-wrap">
            <Lift><Button onClick={() => go("score")}>Get scored <ArrowRight size={14} /></Button></Lift>
            <Button variant="secondary" onClick={() => go("jobs")}>Browse jobs</Button>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.08}>
        <Card className="p-4 flex items-center gap-4 flex-wrap justify-center text-center">
          <div><div className="text-2xl font-extrabold tabular-nums">{SAMPLE.total}</div><div className="text-[11px] text-zinc-500">sample ATS / 95</div></div>
          <div className="w-px h-8 bg-white/10" />
          <div><div className="text-2xl font-extrabold tabular-nums">{ELIGIBLE}</div><div className="text-[11px] text-zinc-500">jobs unlocked</div></div>
          <div className="w-px h-8 bg-white/10" />
          <div><div className="text-2xl font-extrabold tabular-nums">100%</div><div className="text-[11px] text-zinc-500">free links</div></div>
        </Card>
      </FadeUp>

      <ol className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.07]">
        {FUNNEL.map((s, i) => (
          <FadeUp key={s.title} delay={0.05 + i * 0.03}>
            <li className="flex items-baseline gap-4 p-4">
              <span className="text-2xl font-extrabold tabular-nums text-zinc-600 shrink-0">{i + 1}</span>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
              </div>
            </li>
          </FadeUp>
        ))}
      </ol>

      <FadeUp delay={0.25}>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-2.5 text-xs text-zinc-400">
          <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
          Private by design: PDFs are parsed locally and discarded. Only numbers compete.
        </div>
      </FadeUp>
    </div>
  );
}
