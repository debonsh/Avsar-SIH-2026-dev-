// ponytail: local-first post form. Writes localStorage instantly (demo-safe),
// mirrors to Supabase jobs_board best-effort. Same Card/Field/Button primitives.
import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2, Users } from "lucide-react";
import { ROLES } from "../lib/score";
import { saveCustomJob, loadCustomJobs, createJobBoard, loadApplications, countRemoteApplications, countLocalApplications } from "../lib/store";
import { Badge, Button, Card, CardHead, Field, inputCls } from "./ui";
import { FadeUp } from "./amicro";

const TYPES = ["Internship", "Full-time", "Govt"];
const empty = { title: "", company: "", loc: "Remote", type: "Internship", role: "sde", skills: "", minScore: 40, apply: "", description: "" };

export default function IndustryPost({ onPosted }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [mine, setMine] = useState(() => loadCustomJobs());
  const [counts, setCounts] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let live = true;
    (async () => {
      const next = {};
      for (const j of mine.slice(0, 20)) {
        const remote = await countRemoteApplications(j.id);
        const local = countLocalApplications(j.id);
        next[j.id] = (remote ?? 0) + local;
      }
      if (live) setCounts(next);
    })();
    return () => { live = false; };
  }, [mine]);

  function submit() {
    const skills = form.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!form.title.trim() || !form.company.trim() || !skills.length) {
      setErr("Title, company, and at least one skill are required.");
      return;
    }
    const job = {
      id: `local-${Date.now()}`, role: form.role, title: form.title.trim(), company: form.company.trim(),
      loc: form.loc.trim() || "Remote", type: form.type, skills,
      minScore: Math.max(0, Math.min(95, Number(form.minScore) || 40)),
      apply: form.apply.trim() || "#", description: form.description.trim(),
    };
    setMine(saveCustomJob(job));
    createJobBoard(job); // best-effort mirror, never blocks
    setForm(empty);
    setErr("");
    onPosted?.();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <FadeUp>
        <h1 className="text-2xl font-bold tracking-tight">Industry portal</h1>
        <p className="text-sm text-zinc-500 mt-1">Post once — students whose score earns it see it instantly.</p>
      </FadeUp>
      <FadeUp delay={0.05} className="mt-4">
        <Card>
          <CardHead title="Post an opening" desc="Saved on this device + mirrored to board when online" />
          <div className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Role title *"><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Frontend Intern" className={inputCls} /></Field>
              <Field label="Company *"><input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Pvt Ltd" className={inputCls} /></Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Location"><input value={form.loc} onChange={(e) => set("loc", e.target.value)} placeholder="Remote" className={inputCls} /></Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={`${inputCls} cursor-pointer`}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Min ATS"><input type="number" min="0" max="95" value={form.minScore} onChange={(e) => set("minScore", e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Target track">
                <select value={form.role} onChange={(e) => set("role", e.target.value)} className={`${inputCls} cursor-pointer`}>
                  {Object.entries(ROLES).map(([v, r]) => <option key={v} value={v}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Apply URL"><input value={form.apply} onChange={(e) => set("apply", e.target.value)} placeholder="https://…" className={inputCls} /></Field>
            </div>
            <Field label="Required skills (comma separated) *" hint="Match the track vocabulary so ATS can find them">
              <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="react, javascript, git" className={inputCls} />
            </Field>
            <Field label="Short description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What will the intern do?" className={`${inputCls} h-20 resize-y`} /></Field>
            {err && <p className="text-xs text-amber-400">{err}</p>}
            <Button className="w-full" onClick={submit}><Briefcase size={14} /> Publish opening</Button>
          </div>
        </Card>
      </FadeUp>
      <FadeUp delay={0.1} className="mt-4">
        <Card>
          <CardHead title="My postings" desc={`${mine.length} live`} right={mine.length > 0 && <Badge tone="emerald"><CheckCircle2 size={11} /> Live in feed</Badge>} />
          <div className="p-4 space-y-2">
            {mine.length === 0 && <p className="text-xs text-zinc-500">Nothing posted yet — your first posting appears in the student feed immediately.</p>}
            {mine.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{j.title} <span className="text-zinc-500 font-normal">· {j.company}</span></div>
                  <div className="text-[11px] text-zinc-500">needs ATS {j.minScore}+ · {j.skills.join(", ")}</div>
                </div>
                <Badge tone="zinc" title="Students who applied"><Users size={11} /> {counts[j.id] ?? loadApplications().filter((a) => a.jobId === j.id).length}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </FadeUp>
    </div>
  );
}
