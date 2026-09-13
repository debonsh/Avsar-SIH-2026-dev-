// ponytail: floating coach button + non-modal drawer (no backdrop, nav stays live). Same primitives.
import { useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { COACH_ACTIONS, buildPrompt, localAnswer } from "../lib/coach";
import { ask } from "../lib/gemini";
import { TONES, getTone, setTone, getCustom, setCustom } from "../data/tuning";
import { Card, MiniMd } from "./ui";
import { FadeUp } from "./amicro";

export default function AICoach({ roleLabel, score, missing, found, bestFitLabel, resumeText }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { from: "bot", text: "Grounded in your live score and gaps. Pick a quick action or ask anything." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tone, setToneUi] = useState(() => getTone());
  const [custom, setCustomUi] = useState(() => getCustom());
  const [tuneOpen, setTuneOpen] = useState(false);
  const bottomRef = useRef(null);

  const state = { roleLabel, score, missing, found, bestFitLabel, resumeText };

  async function run(actionId, question) {
    const label = actionId === "ask"
      ? question
      : COACH_ACTIONS.find((a) => a.id === actionId)?.label || actionId;
    setMsgs((m) => [...m, { from: "user", text: label }]);
    setBusy(true);
    try {
      const ai = await ask(buildPrompt(actionId, actionId === "ask" ? { ...state, question } : state));
      const text = ai || `${localAnswer(actionId, state)}\n\n· offline tips — add VITE_GROQ_KEY for AI answers`;
      setMsgs((m) => [...m, { from: "bot", text }]);
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    run("ask", q);
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} title="AI help bot"
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-white text-zinc-950 shadow-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <Sparkles size={20} />
        </button>
      )}
      {open && (
        <FadeUp className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)]">
          <Card className="p-0 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
              <Sparkles size={15} className="text-zinc-100" />
              <span className="text-sm font-semibold">AI Coach</span>
              <span className="text-[11px] text-zinc-500">· knows your score</span>
              <button onClick={() => setOpen(false)} title="Close"
                className="ml-auto text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-white/10">
              <button onClick={() => setTuneOpen((v) => !v)} className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer">
                Tune: {TONES.find((t) => t.id === tone)?.label}{custom ? " + custom" : ""} {tuneOpen ? "▴" : "▾"}
              </button>
              {tuneOpen && (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex gap-1.5">
                    {TONES.map((t) => (
                      <button key={t.id} onClick={() => { setTone(t.id); setToneUi(t.id); }}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border cursor-pointer ${tone === t.id ? "bg-white text-zinc-950 border-white" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}>{t.label}</button>
                    ))}
                  </div>
                  <input value={custom} onChange={(e) => { setCustom(e.target.value); setCustomUi(e.target.value); }}
                    placeholder="Custom instruction: e.g. talk like a senior, no jargon…" className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none text-zinc-200 placeholder:text-zinc-600 focus:border-white/40" />
                </div>
              )}
            </div>
            <div className="h-72 overflow-y-auto p-3 space-y-2">
              {msgs.map((m, i) => (
                <div key={i} className={`max-w-[85%] px-2.5 py-2 rounded-xl text-[13px] leading-snug ${m.from === "user" ? "ml-auto bg-white text-zinc-950 whitespace-pre-wrap" : "bg-white/5 text-zinc-200"}`}>
                  {m.from === "user" ? m.text : <MiniMd text={m.text} />}
                </div>
              ))}
              {busy && <div className="text-xs text-zinc-500">thinking…</div>}
              <div ref={bottomRef} />
            </div>
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {COACH_ACTIONS.map((a) => (
                <button key={a.id} onClick={() => run(a.id)} disabled={busy}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50">
                  {a.label}
                </button>
              ))}
            </div>
            <div className="p-2.5 border-t border-white/10 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Ask anything…" disabled={busy}
                className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-zinc-100 placeholder:text-zinc-500 focus:border-white/40" />
              <button onClick={send} disabled={busy || !input.trim()} title="Send"
                className="w-9 rounded-lg bg-white text-zinc-950 flex items-center justify-center disabled:opacity-50 cursor-pointer">
                <Send size={15} />
              </button>
            </div>
          </Card>
        </FadeUp>
      )}
    </>
  );
}
