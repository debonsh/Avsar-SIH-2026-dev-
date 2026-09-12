// ponytail: showcase = read-only render of live state + two small forms (github, certs). No new UI.
import { useEffect, useMemo, useState } from "react";
import { Award, BadgeCheck, Check, Copy, ExternalLink, Heart, Link2, Printer, Trash2 } from "lucide-react";
import { ROLES } from "../lib/score";
import { QUEST_TREE } from "../data/quests";
import { isCourseDone, isProjectDone, getEvidence } from "../lib/progress";
import { isEvidenceUrl } from "../lib/quests";
import { getOrCreateC2CId, loadCerts, addCert, removeCert, loadGithub, saveGithub, loadNickname, saveNickname } from "../lib/identity";
import { isVerified, fetchKudos, giveKudos, hasGivenKudos, loadKudosFallback, loadSharedShowcase } from "../lib/store";
import { Badge, Button, Card, inputCls } from "./ui";
import { FadeUp } from "./amicro";

export default function PortfolioView({ role, result, main, rank, quizBest, questPairs, questVer, earnedSkills, appliedCount, go }) {
  const myId = getOrCreateC2CId();
  const [sharedId] = useState(() => {
    try {
      const v = new URLSearchParams(location.search).get("c2c");
      return v && v !== myId ? v : null;
    } catch {
      return null;
    }
  });

  if (sharedId) return <SharedPortfolio id={sharedId} />;
  if (!result) {
    return (
      <FadeUp>
        <Card className="p-6 text-center">
          <Award size={28} className="mx-auto text-zinc-600" />
          <h1 className="text-xl font-bold tracking-tight mt-3">Your showcase starts with a score</h1>
          <p className="text-sm text-zinc-500 mt-1">Score → quiz → quests, and this page turns into a shareable profile.</p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => go("score")}>1 · Get scored</Button>
            <Button variant="secondary" size="sm" onClick={() => go("quiz")}>2 · Take the quiz</Button>
            <Button variant="secondary" size="sm" onClick={() => go("quests")}>3 · Finish quests</Button>
          </div>
        </Card>
      </FadeUp>
    );
  }

  return <OwnPortfolio
    myId={myId} role={role} result={result} main={main} rank={rank}
    quizBest={quizBest} questPairs={questPairs} questVer={questVer} earnedSkills={earnedSkills} appliedCount={appliedCount}
  />;
}

function OwnPortfolio({ myId, role, result, main, rank, quizBest, questPairs, questVer, earnedSkills, appliedCount }) {
  const [github, setGithub] = useState(() => loadGithub());
  const [ghEdit, setGhEdit] = useState(false);
  const [ghDraft, setGhDraft] = useState(github);
  const [certs, setCerts] = useState(() => loadCerts());
  const [draft, setDraft] = useState({ issuer: "", title: "", url: "" });
  const [copied, setCopied] = useState(false);
  const [kudos, setKudos] = useState(() => loadKudosFallback(myId));
  const [nick, setNick] = useState(() => loadNickname());
  const [nickEdit, setNickEdit] = useState(false);
  const [nickDraft, setNickDraft] = useState("");

  useEffect(() => {
    let live = true;
    fetchKudos(myId).then((n) => { if (live && n != null) setKudos(n); });
    return () => { live = false; };
  }, [myId]);

  // ponytail: questVer in deps — toggling a quest on this view must re-read storage
  const projects = useMemo(() => {
    void questVer;
    const tree = QUEST_TREE[role];
    if (!tree) return [];
    const out = [];
    for (const br of tree.branches) {
      for (const sk of br.skills) {
        const ev = getEvidence(role, sk.id);
        if (isCourseDone(role, sk.id) && isProjectDone(role, sk.id) && isEvidenceUrl(ev)) {
          out.push({ name: sk.name, url: ev });
        }
      }
    }
    return out;
  }, [role, questVer]);

  const found = result.found || [];
  const missing = result.missing || [];
  const steps = [
    { label: "Resume scored", done: true, sub: `ATS ${result.total}` },
    { label: "Quiz cleared", done: quizBest > 0, sub: quizBest > 0 ? `best ${quizBest}` : "pending" },
    { label: "Quests verified", done: questPairs > 0, sub: questPairs > 0 ? `${questPairs} pair${questPairs === 1 ? "" : "s"}` : "pending" },
    { label: "Jobs applied", done: appliedCount > 0, sub: appliedCount > 0 ? `${appliedCount} applied` : "pending" },
  ];

  async function copyLink() {
    const url = `${location.origin}${location.pathname}?c2c=${myId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* clipboard unavailable */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveNick() {
    const v = nickDraft.trim().slice(0, 24);
    saveNickname(v);
    setNick(v);
    setNickEdit(false);
  }

  function saveGh() {
    setGithub(saveGithub(ghDraft));
    setGhEdit(false);
  }

  function submitCert() {
    if (!draft.title.trim()) return;
    setCerts(addCert(draft));
    setDraft({ issuer: "", title: "", url: "" });
  }

  return (
    <div>
      <FadeUp>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Showcase</h1>
              <Badge tone="light" className="font-mono">{myId}</Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{ROLES[role]?.label ?? role} · numbers compete, resumes stay private</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400">
            <Heart size={13} /> <span className="tabular-nums font-semibold">{kudos}</span> kudos
          </span>
        </div>
      </FadeUp>

      <FadeUp className="mt-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <span>Display name: <span className="text-zinc-200 font-medium">{nick || "Anonymous Coder"}</span></span>
          {!nickEdit ? (
            <button onClick={() => { setNickDraft(nick); setNickEdit(true); }}
              className="underline hover:text-zinc-300 cursor-pointer">edit</button>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <input value={nickDraft} onChange={(e) => setNickDraft(e.target.value)} placeholder="Anonymous Coder"
                maxLength={24} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 outline-none text-zinc-100 w-36" />
              <button onClick={saveNick} className="text-emerald-400 hover:underline cursor-pointer">save</button>
            </span>
          )}
          <span className="text-zinc-600">· shown on the battle board</span>
        </div>
      </FadeUp>

      <FadeUp delay={0.05} className="mt-4">
        <Card className="p-5 flex items-center gap-5 flex-wrap">
          <div>
            <div className="text-4xl font-bold tabular-nums">{main}</div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">MAIN score</div>
          </div>
          <Badge tone={main >= 65 ? "emerald" : "zinc"} className="text-sm px-3 py-1">{rank}</Badge>
          <div className="text-xs text-zinc-500 ml-auto tabular-nums">
            ATS {result.total} · Quiz {quizBest} · {questPairs} quest pair{questPairs === 1 ? "" : "s"}
          </div>
        </Card>
      </FadeUp>

      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <FadeUp delay={0.08}>
          <Card className="p-4">
            <div className="text-xs font-semibold mb-3">Skills · tick = verified proof</div>
            <div className="flex flex-wrap gap-1.5">
              {found.map((s) => (
                <span key={s} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${isVerified(s, earnedSkills, github) ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-300"}`}>
                  {isVerified(s, earnedSkills, github) && <BadgeCheck size={12} />} {s}
                </span>
              ))}
              {found.length === 0 && <span className="text-xs text-zinc-500">No skills detected yet.</span>}
            </div>
            {missing.length > 0 && (
              <div className="mt-3 text-xs text-zinc-500">Still missing: <span className="text-zinc-400">{missing.slice(0, 5).join(" · ")}</span></div>
            )}
          </Card>
        </FadeUp>
        <FadeUp delay={0.1}>
          <Card className="p-4">
            <div className="text-xs font-semibold mb-3">Journey</div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${s.done ? "bg-emerald-500 text-zinc-950" : "bg-white/10 text-zinc-500"}`}>
                    {s.done ? <Check size={12} /> : i + 1}
                  </span>
                  <span className={s.done ? "text-zinc-200" : "text-zinc-500"}>{s.label}</span>
                  <span className="ml-auto text-xs text-zinc-500 tabular-nums">{s.sub}</span>
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>
      </div>

      {projects.length > 0 && (
        <FadeUp delay={0.12} className="mt-3">
          <Card className="p-4">
            <div className="text-xs font-semibold mb-3">Verified projects · course + build + proof link</div>
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <BadgeCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-zinc-200">{p.name}</span>
                  <a href={p.url} target="_blank" rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer">
                    Proof <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>
      )}

      <FadeUp delay={0.13} className="mt-3 print:hidden">
        <Card className="p-4">
          <div className="text-xs font-semibold mb-2">GitHub · linking verifies every found skill</div>
          {github && !ghEdit ? (
            <div className="flex items-center gap-2 text-sm">
              <Link2 size={14} className="text-zinc-500" />
              <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer"
                className="text-zinc-200 hover:text-white cursor-pointer">github.com/{github}</a>
              <button onClick={() => { setGhDraft(github); setGhEdit(true); }}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-200 cursor-pointer">Edit</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={ghDraft} onChange={(e) => setGhDraft(e.target.value)} placeholder="octocat"
                className={inputCls} />
              <Button size="sm" onClick={saveGh} disabled={!ghDraft.trim()}>Link</Button>
              {github && <Button variant="secondary" size="sm" onClick={() => setGhEdit(false)}>Cancel</Button>}
            </div>
          )}
        </Card>
      </FadeUp>

      <FadeUp delay={0.14} className="mt-3">
        <Card className="p-4">
          <div className="text-xs font-semibold mb-3">Certifications · URL = verified tick</div>
          <div className="space-y-2">
            {certs.map((c) => (
              <div key={c.at} className="flex items-center gap-2 text-sm">
                {isEvidenceUrl(c.url)
                  ? <BadgeCheck size={14} className="text-emerald-400 shrink-0" />
                  : <Award size={14} className="text-zinc-600 shrink-0" />}
                <span className="text-zinc-200">{c.title}</span>
                <span className="text-xs text-zinc-500">· {c.issuer}</span>
                {isEvidenceUrl(c.url) && (
                  <a href={c.url} target="_blank" rel="noreferrer"
                    className="ml-auto text-xs text-zinc-400 hover:text-white cursor-pointer">Verify</a>
                )}
                <button onClick={() => setCerts(removeCert(c.at))}
                  className="text-zinc-600 hover:text-zinc-300 cursor-pointer print:hidden" title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {certs.length === 0 && <div className="text-xs text-zinc-500">No certs logged yet — NPTEL, Coursera, anything with a URL.</div>}
          </div>
          <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 mt-3 print:hidden">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Certificate title" className={inputCls} />
            <input value={draft.issuer} onChange={(e) => setDraft({ ...draft, issuer: e.target.value })} placeholder="Issuer" className={inputCls} />
            <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="Credential URL" className={inputCls} />
            <Button size="sm" onClick={submitCert} disabled={!draft.title.trim()}>Add</Button>
          </div>
        </Card>
      </FadeUp>

      <FadeUp delay={0.16} className="mt-3 print:hidden">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={copyLink}>
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy showcase link</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={13} /> Print / Save PDF
          </Button>
        </div>
      </FadeUp>
    </div>
  );
}

function SharedPortfolio({ id }) {
  const [show, setShow] = useState(null);
  const [kudos, setKudos] = useState(0);
  const [gave, setGave] = useState(() => hasGivenKudos(id));

  useEffect(() => {
    let live = true;
    (async () => {
      const [s, k] = await Promise.all([loadSharedShowcase(id), fetchKudos(id)]);
      if (!live) return;
      setShow(s);
      setKudos(Math.max(k ?? 0, loadKudosFallback(id)));
    })();
    return () => { live = false; };
  }, [id]);

  async function kudo() {
    if (gave) return;
    await giveKudos(id);
    setGave(true);
    setKudos((k) => k + 1);
  }

  return (
    <FadeUp>
      <Card className="p-6 text-center max-w-lg mx-auto">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Shared showcase</div>
        <div className="font-mono font-bold text-lg mt-1">{id}</div>
        {show ? (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[[show.bestMain, "best MAIN"], [show.applications, "applications"], [kudos, "kudos"]].map(([v, l]) => (
              <div key={l} className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold tabular-nums">{v}</div>
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">{l}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 mt-4">
            Profile not found on this device — the owner opens it here once, or connect the backend.
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {["Clean code", "Great demo", "Job-ready"].map((chip) => (
            <Button key={chip} size="sm" variant="secondary" onClick={kudo} disabled={gave} title={`Kudos: ${chip}`}>
              <Heart size={13} /> {chip}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">{gave ? "Kudos given — thanks for recognizing real proof." : "One tap per viewer. Kudos mark verified proof, not popularity."}</p>
      </Card>
    </FadeUp>
  );
}
