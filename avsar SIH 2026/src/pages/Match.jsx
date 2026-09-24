// How we match: the formula is the feature. The five weights are fixed and published;
// what the live corpus changes is how much each REQUIRED SKILL counts toward this score,
// and the page shows both numbers side by side so the adjustment is auditable.
// Recruiters see the same math on the other side, no black box.
import { useEffect, useMemo, useState } from "react";
import { Page, Card, H2, Chip, Badge, Meter, Empty, Btn } from "../components/ui.jsx";
import { useAvsar } from "../app/store.jsx";
import { MATCH_WEIGHTS, matchScore, profileForMatching } from "../lib/match.js";
import { effectiveWeights } from "../lib/market.js";
import { corpusWithLive, portalOf } from "../lib/corpus.js";
import { listLiveJobs } from "../lib/store.js";
import { loadProfile } from "../lib/profile.js";
import { loadText, saveText } from "../lib/storage.js";
import { requiredFor, taxonomyRole, TAXONOMY_ROLES } from "../data/taxonomy.js";
import { loadQuizBest } from "../data/quiz.js";
import { ROLES } from "../lib/score.js";
import { loadQAnswers, compileEvidence } from "../lib/questionnaire.js";
import { targetRoleFor } from "../lib/track.js";

const MARKET_MODE_KEY = "avsar-market-mode";

const FACTORS = [
  { key: "coverage", label: "Skill coverage", what: "fraction of required skills you hold" },
  { key: "proficiency", label: "Proficiency fit", what: "your level vs the level the role needs" },
  { key: "verified", label: "Verified ratio", what: "verified vs self-claimed skills" },
  { key: "recency", label: "Recency of evidence", what: "skills go stale on a half-life" },
  { key: "interest", label: "Interest alignment", what: "your assessed interests vs role tags" },
];

export default function Match() {
  const { lane, track, resume, customJobs } = useAvsar();
  // the seeded dream role for whichever portal the student is on.
  const targetId = targetRoleFor(lane);
  const target = taxonomyRole(targetId);
  const quizBest = loadQuizBest(lane);
  const found = useMemo(() => resume?.result?.found || [], [resume]);
  const interests = useMemo(() => compileEvidence(loadQAnswers(lane)).claims, [lane]);
  const [marketOn, setMarketOn] = useState(() => loadText(MARKET_MODE_KEY, "on") !== "off");
  const [liveJobs, setLiveJobs] = useState([]);

  const portal = portalOf(track, lane);
  useEffect(() => {
    listLiveJobs(false, loadProfile() || {}, lane).then(setLiveJobs).catch(() => {});
  }, [lane]);

  const market = useMemo(
    () => effectiveWeights(corpusWithLive(portal, liveJobs, customJobs), { lane: portal }),
    [portal, liveJobs, customJobs]
  );
  const weights = marketOn && market.weights.size ? market.weights : null;

  function toggleMarket() {
    const next = !marketOn;
    setMarketOn(next);
    saveText(MARKET_MODE_KEY, next ? "on" : "off");
  }

  const profile = useMemo(() => {
    if (!found.length) return null;
    return profileForMatching(lane, found, quizBest, interests);
  }, [found, lane, quizBest, interests]);

  const heldFor = (p) => p.skills.map((s) => ({
    skill: s, level: p.levels[s], verified: p.verified.includes(s), lastUsedAt: p.usedAt[s] || 0,
  }));

  const base = useMemo(() => {
    if (!profile) return null;
    return matchScore({ required: requiredFor(targetId), held: heldFor(profile), tags: target.tags, interests });
  }, [profile, targetId, target, interests]);

  const live = useMemo(() => {
    if (!profile) return null;
    return matchScore({ required: requiredFor(targetId), held: heldFor(profile), tags: target.tags, interests, weights });
  }, [profile, targetId, target, interests, weights]);

  // pathways: every taxonomy role ranked by the same engine — skill mapping
  // to roles, not a hardcoded "recommended" list.
  const pathways = useMemo(() => {
    if (!profile) return [];
    const held = heldFor(profile);
    const wantsAyush = lane === "ayush";
    return Object.entries(TAXONOMY_ROLES)
      // each portal ranks its own domains: ayush roles on vaidya, the rest on tech.
      .filter(([, r]) => String(r.domain || "").startsWith("ayush") === wantsAyush)
      .map(([id, r]) => ({ id, ...r, ...matchScore({ required: requiredFor(id), held, tags: r.tags, interests, weights }) }))
      .sort((a, b) => b.score - a.score);
  }, [profile, lane, interests, weights]);

  return (
    <Page
      title="How we match"
      sub="One published formula scores every internship, job, and shortlist. The five weights below are fixed; what the live market moves is how much each required skill counts."
    >
      <Card>
        <H2>The formula</H2>
        <p className="font-mono text-xs leading-6 text-zinc-400">
          matchScore ={" "}
          {FACTORS.map((f, i) => (
            <span key={f.key}>
              <strong className="text-emerald-400">{MATCH_WEIGHTS[f.key].toFixed(2)}</strong> × {f.key}
              {i < FACTORS.length - 1 ? " + " : ""}
            </span>
          ))}
        </p>
        <div className="mt-4 space-y-3">
          {FACTORS.map((f) => (
            <div key={f.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-zinc-100">
                  {f.label} <span className="font-mono text-xs text-emerald-400">{(MATCH_WEIGHTS[f.key] * 100).toFixed(0)}%</span>
                </span>
                <span className="text-xs text-zinc-500">{f.what}</span>
              </div>
              <div className="mt-1"><Meter value={MATCH_WEIGHTS[f.key] * 100} max={100} /></div>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-zinc-800 pt-3 text-xs leading-5 text-zinc-500">
          Levels run L1 Aware to L5 Expert on the NCrF-mapped taxonomy. Evidence decays on each skill&rsquo;s
          half-life. A skill you haven&rsquo;t used in a year counts for less. That is the NEP 2020 point:
          proficiency is measured, not claimed.
        </p>
      </Card>

      <Card className="mt-4">
        <H2>The market term</H2>
        <p className="text-xs leading-5 text-zinc-400">
          These five weights never change. Above them sits one live multiplier: inside a posting, a required skill
          that most of the corpus asks for counts for more than one nobody lists, capped by the taxonomy band
          0.6 to 1.5. It is computed from {market.sample.total} postings in the {portal === "ayush" ? "ayush" : "tech"} lane,
          {market.sample.observed} of which ask for a skill often enough to move anything.
          {market.sample.dated ? ` ${market.sample.dated} of them carry dates.` : " None of them carry dates."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn size="sm" variant={marketOn ? "primary" : "quiet"} onClick={toggleMarket}>
            {marketOn ? "Market-adjusted: on" : "Market-adjusted: off"}
          </Btn>
          <Badge tone={market.sample.observed ? "green" : "amber"}>
            {market.sample.observed ? `${market.sample.observed} weighted skills` : "corpus too thin, all neutral"}
          </Badge>
          <Btn to="/market" size="sm" variant="quiet">See the corpus</Btn>
        </div>
      </Card>

      <Card className="mt-4">
        <H2>Your live breakdown: you vs {target.label}</H2>
        {!live ? (
          <Empty
            title="No skill profile yet"
            body={`Score your resume once and this card computes your real five-factor fit against the ${target.label} role.`}
            action={<Btn to="/resume">Score your resume</Btn>}
          />
        ) : (
          <>
            <p className="font-display text-4xl font-bold tabular-nums text-zinc-50">
              {live.score}<span className="text-lg text-zinc-500">/100 · {live.band}</span>
            </p>
            {base && base.score !== live.score && (
              <p className="mt-1 text-xs text-zinc-500">
                Published formula alone: <span className="font-mono tabular-nums text-zinc-300">{base.score}</span>
                <span className={live.score > base.score ? " text-emerald-400" : " text-amber-400"}>
                  {" "}({live.score > base.score ? "+" : ""}{live.score - base.score} from live demand)
                </span>
              </p>
            )}
            {weights && live.matched.some((m) => m.weight !== 1) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {live.matched
                  .filter((m) => m.weight !== 1)
                  .sort((a, b) => Math.abs(b.weight - 1) - Math.abs(a.weight - 1))
                  .slice(0, 6)
                  .map((m) => (
                    <Chip key={m.skill} tone={m.weight > 1 ? "green" : "amber"}>{m.skill} x{m.weight}</Chip>
                  ))}
              </div>
            )}
            <div className="mt-4 space-y-3">
              {FACTORS.map((f) => (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-zinc-300">{f.label}</span>
                    <span className="font-mono text-xs tabular-nums text-zinc-400">
                      {Math.round(live.breakdown[f.key] * 100)}% × {MATCH_WEIGHTS[f.key].toFixed(2)} = {(live.breakdown[f.key] * MATCH_WEIGHTS[f.key] * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1"><Meter value={Math.round(live.breakdown[f.key] * 100)} max={100} /></div>
                </div>
              ))}
            </div>
            <H2 className="mt-5">Why this number</H2>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              {live.why.map((w, i) => (
                <li key={i} className="flex gap-2"><span className="text-emerald-400">·</span>{w}</li>
              ))}
            </ul>
            {live.gaps.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {live.gaps.map((g) => (
                  <Chip key={g.skill} tone="amber">{g.skill}: L{g.have} → L{g.need}</Chip>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn to="/quests" size="sm">Close a gap</Btn>
              <Btn to="/jobs" size="sm" variant="quiet">See match-scored roles</Btn>
            </div>
          </>
        )}
      </Card>

      {pathways.length > 0 && (
        <Card className="mt-4">
          <H2>Your pathways: {lane === "ayush" ? "ayush roles" : `${ROLES[lane]?.label || lane} and nearby roles`}, same math</H2>
          <ul className="divide-y divide-zinc-800">
            {pathways.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{p.label}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {p.gaps.length === 0 ? "No gaps. You clear the bar." : `missing: ${p.gaps.slice(0, 3).map((g) => g.skill).join(", ")}${p.gaps.length > 3 ? ` +${p.gaps.length - 3}` : ""}`}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-sm font-bold tabular-nums text-emerald-400">{p.score}</span>
                  <Btn to="/quests" size="sm" variant="quiet">Path</Btn>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}
