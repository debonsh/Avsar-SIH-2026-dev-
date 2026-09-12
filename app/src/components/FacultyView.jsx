// ponytail: JobsView-lite for faculty. Kind tabs + search + interest toggle, no new UI.
import { useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Heart, Search } from "lucide-react";
import { FDPS, FDP_KINDS } from "../data/fdps";
import { loadInterests, toggleInterest, recordInterest } from "../lib/store";
import { Badge, Card, inputCls } from "./ui";
import { FadeUp, Segmented } from "./amicro";

const KIND_OPTS = [{ value: "all", label: "All" }, ...Object.entries(FDP_KINDS).map(([value, label]) => ({ value, label }))];

export default function FacultyView() {
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [interested, setInterested] = useState(() => loadInterests());

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FDPS.filter((f) =>
      (kind === "all" || f.kind === kind) &&
      (!mineOnly || interested.includes(f.id)) &&
      (!needle || `${f.title} ${f.org} ${f.loc}`.toLowerCase().includes(needle))
    );
  }, [kind, q, mineOnly, interested]);

  function flip(f) {
    if (interested.includes(f.id)) {
      setInterested(toggleInterest(f.id));
    } else {
      setInterested([...interested, f.id]);
      recordInterest(f); // best-effort mirror, never blocks
    }
  }

  return (
    <div>
      <FadeUp>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty opportunities</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {visible.length} open · {interested.length} interested — FDPs, faculty internships, consultancy, workshops
            </p>
          </div>
          <button
            onClick={() => setMineOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer ${mineOnly ? "border-rose-500/30 bg-rose-500/10 text-rose-400" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            <Heart size={13} /> Interested ({interested.length})
          </button>
        </div>
      </FadeUp>

      <FadeUp delay={0.05} className="mt-4">
        <Card className="p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, org, location…"
              className={`${inputCls} pl-9`} />
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Segmented options={KIND_OPTS} value={kind} onChange={setKind} />
          </div>
        </Card>
      </FadeUp>

      <div className="space-y-3 mt-4">
        {visible.length === 0 && (
          <Card className="p-5 text-sm text-zinc-400">
            {mineOnly
              ? "Nothing here yet — tap Express interest on any card and it lands on this shelf."
              : "No matches. Try a different keyword or kind."}
          </Card>
        )}
        {visible.map((f, i) => {
          const on = interested.includes(f.id);
          return (
            <FadeUp key={f.id} delay={Math.min(i * 0.03, 0.2)}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-[15px] leading-snug">{f.title}</div>
                  <Badge tone="zinc">{FDP_KINDS[f.kind]}</Badge>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{f.org} • {f.loc}</div>
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                    <CalendarDays size={13} /> Apply by {f.deadline}
                  </span>
                  <div className="flex items-center gap-2">
                    <a href={f.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer">
                      Details <ExternalLink size={12} />
                    </a>
                    <button onClick={() => flip(f)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${on ? "border-rose-500/30 bg-rose-500/10 text-rose-400" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}>
                      <Heart size={12} /> {on ? "Interested" : "Express interest"}
                    </button>
                  </div>
                </div>
              </Card>
            </FadeUp>
          );
        })}
      </div>
    </div>
  );
}
