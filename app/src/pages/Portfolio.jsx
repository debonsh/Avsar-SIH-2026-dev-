import { useEffect, useState } from "react";
import { Page, Card, H2, Btn, Field, Chip, inputCls } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import {
  getOrCreateC2CId, loadNickname, saveNickname, loadGithub, saveGithub,
  loadCerts, addCert, removeCert,
} from "../lib/identity.js";
import { isVerified, fetchKudos, loadKudosFallback } from "../lib/store.js";
import { completedSkillIdsForRole, getEvidence } from "../lib/progress.js";
import { submitFeedback } from "../lib/backend.js";

export default function Portfolio() {
  const { role, resume } = useC2C();
  const [nick, setNick] = useState(() => loadNickname());
  const [github, setGithub] = useState(() => loadGithub());
  const [certs, setCerts] = useState(() => loadCerts());
  const [issuer, setIssuer] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [thanks, setThanks] = useState(false);
  const [kudos, setKudos] = useState(() => loadKudosFallback(getOrCreateC2CId()));

  const id = getOrCreateC2CId();
  const found = resume?.result?.found || [];
  const earned = completedSkillIdsForRole(role);
  const proofSkills = earned.filter((s) => getEvidence(role, s));

  useEffect(() => {
    fetchKudos(id).then((n) => { if (n != null) setKudos(n); }).catch(() => {});
  }, [id]);

  function saveIdentity() {
    saveNickname(nick.trim());
    saveGithub(github.trim());
  }

  function add() {
    if (!title.trim()) return;
    setCerts(addCert({ issuer: issuer.trim() || "Self", title: title.trim(), url: url.trim() }));
    setIssuer(""); setTitle(""); setUrl("");
  }

  async function rate() {
    if (!stars) return;
    await submitFeedback({ rating: stars, comment: comment.trim() }).catch(() => {});
    setThanks(true);
  }

  return (
    <Page title="Portfolio" sub="Everything you have proven, in one place. Your public ID lets colleges verify it.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <H2>Identity</H2>
          <div className="grid gap-3">
            <Field label="Display name">
              <input className={inputCls} value={nick} onChange={(e) => setNick(e.target.value)} onBlur={saveIdentity} placeholder="Your name" />
            </Field>
            <Field label="GitHub profile" hint="A linked GitHub verifies every skill on your resume.">
              <input className={inputCls} value={github} onChange={(e) => setGithub(e.target.value)} onBlur={saveIdentity} placeholder="https://github.com/you" />
            </Field>
            <p className="text-xs text-zinc-500">Public ID: <span className="font-mono">{id.slice(0, 8)}</span> · Kudos received: <strong className="tabular-nums">{kudos}</strong></p>
          </div>

          <H2 className="mt-5">Verified skills ({found.filter((s) => isVerified(s, earned, github)).length}/{found.length})</H2>
          <div className="flex flex-wrap gap-1.5">
            {found.map((s) => (
              <Chip key={s} tone={isVerified(s, earned, github) ? "green" : "zinc"}>{s}</Chip>
            ))}
            {found.length === 0 && <p className="text-sm text-zinc-500">Score a resume to list skills here.</p>}
          </div>

          {proofSkills.length > 0 && (
            <>
              <H2 className="mt-5">Proof links</H2>
              <ul className="space-y-1.5">
                {proofSkills.map((s) => (
                  <li key={s} className="text-sm">
                    <span className="text-zinc-600">{s}: </span>
                    <a className="font-medium text-green-800 underline" href={getEvidence(role, s)} target="_blank" rel="noreferrer">{getEvidence(role, s)}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <H2>Certifications ({certs.length})</H2>
            <ul className="space-y-2">
              {certs.map((c, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span>
                    <strong className="text-zinc-900">{c.title}</strong>
                    <span className="text-zinc-500"> · {c.issuer}</span>
                    {c.url && <> · <a className="font-medium text-green-800 underline" href={c.url} target="_blank" rel="noreferrer">view</a></>}
                  </span>
                  <button type="button" className="shrink-0 text-xs font-medium text-red-700 underline" onClick={() => setCerts(removeCert(i))}>
                    Remove
                  </button>
                </li>
              ))}
              {certs.length === 0 && <li className="text-sm text-zinc-500">None added. Free course certs from the Quests page belong here.</li>}
            </ul>
            <div className="mt-3 grid gap-2">
              <Field label="Certificate title">
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SQL Basic, HackerRank" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Issuer">
                  <input className={inputCls} value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="HackerRank" />
                </Field>
                <Field label="URL (optional)">
                  <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                </Field>
              </div>
              <Btn variant="quiet" onClick={add} disabled={!title.trim()}>Add certificate</Btn>
            </div>
          </Card>

          <Card>
            <H2>Rate this app</H2>
            {thanks ? (
              <p className="text-sm text-zinc-600">Thanks. Your rating helps the placement cell read real sentiment.</p>
            ) : (
              <>
                <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border text-lg ${stars >= n ? "border-green-600 bg-green-50 text-green-700" : "border-zinc-200 text-zinc-300 hover:border-zinc-400"}`}
                      onClick={() => setStars(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Field label="Comment (optional)">
                    <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What helped most?" />
                  </Field>
                </div>
                <Btn className="mt-3" onClick={rate} disabled={!stars}>Submit rating</Btn>
              </>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
