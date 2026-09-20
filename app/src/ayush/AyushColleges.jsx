// [ayush] permitted-colleges directory. ncism 2025-26 permission data.
import { useState } from "react";
import { Page, Card, Field, Chip, inputCls } from "../components/ui.jsx";
import Masthead from "./Masthead.jsx";
import { AYUSH_COLLEGES } from "./data.js";

export default function AyushColleges() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");

  const list = AYUSH_COLLEGES.filter((c) => {
    if (kind !== "all" && c.kind !== kind) return false;
    if (q && !`${c.name} ${c.city}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const seats = list.reduce((a, c) => a + (c.seats || 0), 0);

  return (
    <div className="ayush-light bg-[#f4f4f4] pb-4 text-zinc-900">
      <Masthead />
      <Page
        title="colleges"
        sub={`permitted bams seats 2025-26 · showing ${list.length} colleges · ${seats} seats`}
      >
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="search name or city">
              <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="patna, jamnagar" />
            </Field>
            <Field label="ownership">
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="all">all ({AYUSH_COLLEGES.length})</option>
                <option value="government">government</option>
                <option value="private">private</option>
                <option value="university">university</option>
                <option value="national institute">national institute</option>
              </select>
            </Field>
          </div>
        </Card>
        <div className="mt-4 overflow-x-auto border border-zinc-800">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                <th className="px-4 py-2 font-medium">college</th>
                <th className="px-4 py-2 font-medium">city</th>
                <th className="px-4 py-2 font-medium">type</th>
                <th className="px-4 py-2 text-right font-medium">seats</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-zinc-800 first:border-t-0 hover:bg-zinc-900">
                  <td className="px-4 py-2.5">
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-zinc-100 underline decoration-zinc-700 underline-offset-4 hover:text-white">
                      {c.name}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{c.city}</td>
                  <td className="px-4 py-2.5"><Chip>{c.kind}</Chip></td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-200">{c.seats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[11px] text-zinc-600">
          {"// source: ncism permission lists 2025-26. verify before counselling."}
        </p>
      </Page>
    </div>
  );
}
