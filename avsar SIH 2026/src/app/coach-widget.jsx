// Floating Coach chat. Same offline-first brain as the old Coach page
// (localAnswer instantly, GROQ upgrades when keyed), available everywhere.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { MessageCircle, Send, X } from "lucide-react";
import { Btn, inputCls } from "../components/ui.jsx";
import { useC2C } from "./store.jsx";
import { COACH_ACTIONS, buildPrompt, localAnswer } from "../lib/coach.js";
import { chat, hasAIKey } from "../lib/ai.js";
import { saveArtifact } from "../lib/backend.js";
import { extractContact } from "../lib/parseResume.js";
import { loadProfile } from "../lib/profile.js";
import { ROLES, rankRoles } from "../lib/score.js";
import { JOBS } from "../data/jobs.js";

const QUICK = COACH_ACTIONS.filter((a) => a.id !== "addjob").slice(0, 5);
const LANG_KEY = "avsar-coach-lang";

const LOG_KEY = "avsar-coach-log";

function loadLog() {
  try {
    const v = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(v) ? v.filter((m) => m && typeof m.text === "string").slice(-30) : [];
  } catch {
    return [];
  }
}

// ponytail: chat bubbles carry light markdown (AI upgrades use **bold**,
// - bullets, 1. steps, ## heads). ~40 lines beats a markdown dep.
function inlineMd(text, key = "") {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return <strong key={`${key}-${i}`} className="font-semibold">{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      return <code key={`${key}-${i}`} className="rounded bg-emerald-900/10 px-1 font-mono text-[13px]">{p.slice(1, -1)}</code>;
    }
    return <span key={`${key}-${i}`}>{p}</span>;
  });
}

function ChatText({ text }) {
  const lines = String(text).split("\n");
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) {
      const Tag = list.ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={`b-${blocks.length}`} className={list.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
          {list.items.map((it, i) => <li key={i}>{inlineMd(it, `b-${blocks.length}-${i}`)}</li>)}
        </Tag>
      );
      list = null;
    }
  };
  lines.forEach((raw) => {
    const line = raw.trim();
    const head = line.match(/^#{1,3}\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);
    const numbered = line.match(/^(?:\d+[.)]|\(\d+\))\s+(.*)/);
    if (head) {
      flush();
      blocks.push(<p key={`b-${blocks.length}`} className="font-semibold">{inlineMd(head[1], `h-${blocks.length}`)}</p>);
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const item = (bullet || numbered)[1];
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(item);
    } else if (!line) {
      flush();
    } else {
      flush();
      blocks.push(<p key={`b-${blocks.length}`}>{inlineMd(line, `p-${blocks.length}`)}</p>);
    }
  });
  flush();
  return <div className="space-y-1.5">{blocks}</div>;
}

export function CoachWidget() {
  const { role, resume } = useC2C();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState(loadLog);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; }
  });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const s = useMemo(() => {
    const r = resume?.result;
    const fit = resume?.text ? rankRoles(resume.text)[0] : null;
    const topJob = JOBS.filter((j) => j.role === role).slice(0, 1)[0] || null;
    const p = loadProfile() || {};
    const profileLine = [p.year, p.lane && `${p.lane} lane`, p.college, p.goal && `goal: ${p.goal}`]
      .filter(Boolean).join(", ") || "";
    return {
      roleLabel: ROLES[role]?.label || role,
      score: r?.total || 0,
      breakdown: r?.breakdown || [],
      found: r?.found || [],
      missing: r?.missing || [],
      bestFitLabel: fit ? ROLES[fit.key]?.label : "",
      topJob,
      profileLine,
      resumeText: resume?.text || "",
      contactName: resume?.text ? extractContact(resume.text).name : "",
    };
  }, [role, resume]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  // persist lang choice
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  }, [lang]);
  useEffect(() => {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-30)));
    } catch {
      /* private mode */
    }
  }, [log ]);

  // ponytail: landing links to /?chat=1 — open once, consume the param
  useEffect(() => {
    if (params.get("chat") === "1") {
      setOpen(true);
      greet();
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep link on mount/param
  }, [params, setParams]);

  function push(kind, text) {
    setLog((prev) => [...prev, { kind, text }].slice(-30));
  }

  function greet() {
    if (log.length > 0) return;
    const name = s.contactName ? ` ${s.contactName.split(" ")[0]}` : "";
    push(
      "coach",
      resume
        ? `Hey${name}. Your resume scores ${s.score}, and ${s.missing[0] || "nothing"} is your biggest gap. Ask me anything, or tap a shortcut below.`
        : `Hey${name}. Score your resume first and I can coach off your real gaps. Until then, ask me anything about the process.`
    );
  }

  async function run(actionId, extra = {}) {
    const answer = localAnswer(actionId, { ...s, ...extra, lang });
    push("you", actionId === "ask" ? extra.question : QUICK.find((a) => a.id === actionId)?.label || COACH_ACTIONS.find((a) => a.id === actionId)?.label || "Question");
    push("coach", answer);
    if (actionId === "match" || actionId === "cover" || actionId === "review") {
      saveArtifact({ kind: actionId, title: `${actionId} for ${s.roleLabel}`, body: answer }).catch(() => {});
    }
    if (!hasAIKey()) return;
    setBusy(true);
    try {
      const better = await chat(buildPrompt(actionId, { ...s, ...extra }), "coach");
      if (better && better !== answer) push("coach-ai", better);
    } catch {
      // offline answer already stands
    }
    setBusy(false);
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-40 flex max-h-[62dvh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
          role="dialog"
          aria-label="Avsar coach chat"
        >
          <div className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-3">
            <span className="relative flex size-2.5">
              <span className="absolute h-full w-full rounded-full bg-blurple" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Coach</p>
              <p className="truncate text-xs text-zinc-500">
                {hasAIKey() ? "Online, knows your resume" : "Offline, knows your resume"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
              aria-label="Toggle language"
              className="rounded-xl border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
            >
              {lang === "en" ? "हिंदी" : "EN"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close coach chat"
              className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="min-h-40 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {log.map((m, i) => (
              <div key={i} className={m.kind === "you" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-6 ${
                    m.kind === "you"
                      ? "bg-blurple text-white"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                  }`}
                >
                  {m.kind === "coach-ai" && (
                    <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-blurple-soft">AI upgrade</p>
                  )}
                  <ChatText text={m.text} />
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-zinc-800 px-4 pb-3 pt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {QUICK.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={busy}
                  onClick={() => run(a.id)}
                  className="shrink-0 rounded-xl border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!question.trim() || busy) return;
                run("ask", { question: question.trim() });
                setQuestion("");
              }}
            >
              <input
                ref={inputRef}
                className={inputCls}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={busy ? "Thinking..." : lang === "hi" ? "अपने बारे में पूछें..." : "Ask about your resume..."}
                aria-label="Ask the coach"
              />
              <Btn type="submit" size="icon" disabled={busy || !question.trim()} aria-label="Send message">
                <Send aria-hidden />
              </Btn>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          greet();
        }}
        aria-label={open ? "Close coach chat" : "Open coach chat"}
        className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-xl bg-blurple text-white transition-colors hover:bg-blurple-deep"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {open ? <X className="size-5" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}
      </button>
    </>
  );
}
