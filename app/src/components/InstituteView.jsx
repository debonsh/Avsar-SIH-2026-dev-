// ponytail: CSS bars only (Meter), no chart lib. Demo cohort + live user row, CSV via Blob.
import { useMemo } from "react";
import { Download, Users } from "lucide-react";
import { ROLES } from "../lib/score";
import { loadNickname } from "../lib/identity";
import { COHORT, enrich, cohortStats, toCSV } from "../lib/cohort";
import { Badge, Card } from "./ui";
import { FadeUp, Meter } from "./amicro";

const FUNNEL = [["scored", "Scored"], ["quiz", "Quiz taken"], ["gold", "Gold+"], ["applied", "Applied"]];

export default function InstituteView({ user }) {
  const live = Boolean(user && (user.ats > 0 || user.quiz > 0));
  const rows = useMemo(
    () => enrich(live ? [...COHORT, { ...user, name: `${loadNickname() || "You"} (live)`, you: true }] : COHORT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, user?.ats, user?.quiz, user?.quests, user?.role, user?.applied, user?.gaps?.length]
  );
  const st = cohortStats(rows);
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.main, 0) / rows.length) : 0;

  function download() {
    const blob = new Blob([toCSV(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "c2c-cohort.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div>
      <FadeUp>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Institute dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {st.total} students{live ? " · your live row included" : " · demo cohort"} — placement readiness at a glance
            </p>
          </div>
          <button onClick={download}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </FadeUp>

      {!live && (
        <FadeUp delay={0.03} className="mt-4">
          <Card className="p-4 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><Users size={14} /> Showing the demo cohort.</span>{" "}
            Score a resume in the student view and your live row joins this table.
          </Card>
        </FadeUp>
      )}

      <FadeUp delay={0.05} className="mt-4">
        <div className="grid grid-cols-3 gap-3">
          {[[st.total, "students"], [avg, "avg MAIN"], [`${st.goldPct}%`, "Gold+"]].map(([v, l]) => (
            <Card key={l} className="p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{v}</div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">{l}</div>
            </Card>
          ))}
        </div>
      </FadeUp>

      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <FadeUp delay={0.08}>
          <Card className="p-4">
            <div className="text-xs font-semibold mb-3">Avg MAIN by track</div>
            <div className="space-y-2.5">
              {Object.entries(ROLES).map(([key, r]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">{r.label}</span>
                    <span className="tabular-nums text-zinc-400">{st.avgByRole[key] ?? "—"}</span>
                  </div>
                  <Meter value={st.avgByRole[key] ?? 0} max={100} />
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>
        <FadeUp delay={0.1}>
          <Card className="p-4">
            <div className="text-xs font-semibold mb-3">Placement funnel</div>
            <div className="space-y-2.5">
              {FUNNEL.map(([key, label]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">{label}</span>
                    <span className="tabular-nums text-zinc-400">{st.funnel[key]}</span>
                  </div>
                  <Meter value={st.funnel[key]} max={Math.max(1, st.total)} tone="bg-emerald-400" />
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>
      </div>

      <FadeUp delay={0.12} className="mt-3">
        <Card className="p-4">
          <div className="text-xs font-semibold mb-3">Top skill gaps</div>
          <div className="space-y-2.5">
            {st.topGaps.map((g) => (
              <div key={g.skill}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">{g.skill}</span>
                  <span className="tabular-nums text-zinc-400">{g.n} students</span>
                </div>
                <Meter value={g.n} max={Math.max(1, st.topGaps[0]?.n ?? 1)} tone="bg-amber-400" />
              </div>
            ))}
          </div>
        </Card>
      </FadeUp>

      <FadeUp delay={0.14} className="mt-3">
        <Card className="p-4 overflow-x-auto">
          <div className="text-xs font-semibold mb-3">Cohort table</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500 uppercase tracking-wider text-[10px]">
                {["Student", "Track", "ATS", "Quiz", "Quests", "MAIN", "Rank", "Applied"].map((h) => (
                  <th key={h} className="pb-2 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.name}-${i}`} className={`border-t border-white/5 ${r.you ? "bg-emerald-500/5" : ""}`}>
                  <td className="py-2 pr-3 text-zinc-200">
                    {r.name} {r.you && <Badge tone="emerald" className="ml-1">you</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-zinc-400">{ROLES[r.role]?.label ?? r.role}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.ats}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.quiz}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.quests}</td>
                  <td className="py-2 pr-3 tabular-nums font-semibold text-zinc-100">{r.main}</td>
                  <td className="py-2 pr-3"><Badge tone={r.main >= 65 ? "emerald" : "zinc"}>{r.rank}</Badge></td>
                  <td className="py-2 pr-3 text-zinc-400">{r.applied ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </FadeUp>
    </div>
  );
}
