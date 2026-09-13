// ponytail: 5-Q interview → profile → md download + "use for jobs" refresh. One file, no router.
import { useState } from "react";
import { Download, Copy, Check, RotateCcw } from "lucide-react";
import { PROFILE_QS, loadProfile, saveProfile, toMarkdown } from "../lib/profile.js";
import { Button, Card, CardHead, Field } from "./ui";
import { FadeUp } from "./amicro";

export default function ProfileView({ onUseForJobs }) {
  const [ans, setAns] = useState(() => loadProfile() || {});
  const [copied, setCopied] = useState(false);
  const done = PROFILE_QS.every((q) => String(ans[q.id] || "").trim());

  function set(id, v) { setAns((a) => ({ ...a, [id]: v })); }

  function save() {
    saveProfile(ans);
    onUseForJobs?.();
  }

  const md = done ? toMarkdown(ans) : "";

  function download() {
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "c2c-profile.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(md); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <FadeUp>
        <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
        <p className="text-sm text-zinc-500 mt-1">5 questions. Jobs + courses scrape for <span className="text-zinc-300">your</span> answers, not a generic feed.</p>
      </FadeUp>
      <FadeUp delay={0.05} className="mt-4">
        <Card>
          <CardHead title="Interview" desc={`${PROFILE_QS.filter((q) => String(ans[q.id] || "").trim()).length}/${PROFILE_QS.length} answered`} />
          <div className="p-4 space-y-4">
            {PROFILE_QS.map((q) => (
              <Field key={q.id} label={q.q}>
                {q.opts ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {q.opts.map((o) => (
                      <button key={o} onClick={() => set(q.id, o)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${ans[q.id] === o ? "bg-white text-zinc-950 border-white" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input value={ans[q.id] || ""} onChange={(e) => set(q.id, e.target.value)} placeholder={q.ph || ""}
                    className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 outline-none placeholder:text-zinc-600 focus:border-white/40" />
                )}
              </Field>
            ))}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={save} disabled={!done}>Save + scrape my jobs</Button>
              {done && (
                <>
                  <Button variant="secondary" size="sm" onClick={download}><Download size={13} /> profile.md</Button>
                  <Button variant="secondary" size="sm" onClick={copy}>{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy md"}</Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </FadeUp>
      {done && (
        <FadeUp delay={0.08} className="mt-3">
          <Card className="p-4">
            <div className="text-xs font-semibold mb-2">c2c-profile.md preview</div>
            <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap leading-relaxed">{md}</pre>
            <button onClick={() => { setAns({}); }} className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer">
              <RotateCcw size={11} /> Retake interview
            </button>
          </Card>
        </FadeUp>
      )}
    </div>
  );
}
