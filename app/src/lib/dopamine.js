// variable dopamine: predictable base (MAIN +pts, always) + controlled-variable
// surprise (rotates deterministically by id+day). Trust-safe: surprises never
// gate jobs, never punish, never fake urgency. Showcase-framed, not job-guarantee.
import { rankFor } from "./score.js";

const RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
const FLOOR = { Bronze: 0, Silver: 50, Gold: 65, Platinum: 80, Diamond: 90 };

// ponytail: FNV-1a hash — deterministic variant per student per day, no server
export function hashStr(s = "") {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

export function nextUnlock(main = 0, missing = []) {
  const rank = rankFor(main);
  const i = RANKS.indexOf(rank);
  const next = RANKS[Math.min(i + 1, RANKS.length - 1)];
  const need = i >= RANKS.length - 1 ? 0 : Math.max(0, FLOOR[next] - main);
  return { rank, next, need, done: i >= RANKS.length - 1, skills: (missing || []).slice(0, 2) };
}

// bridge-gap framing: "close X → showcase-ready + nearer {rank}", never "get job"
export function bridgeLine(main = 0, missing = []) {
  const u = nextUnlock(main, missing);
  if (u.done) return "Diamond — showcase it. Kudos + portfolio do the talking now.";
  const skill = u.skills.length ? `Close ${u.skills.join(" + ")} → showcase-ready` : "1 quest pair";
  return `+${u.need} MAIN → ${u.next} · ${skill}`;
}

// controlled-variable surprise: rotates daily, deterministic, purely additive
// kinds: insight (personalized tip) / spotlight (skill to showcase) / remix (course variant) / kudos-boost (portfolio nudge)
export function variableReward({ id = "anon", day = "", questPairs = 0, quizBest = 0, main = 0, missing = [] } = {}) {
  const kinds = ["insight", "spotlight", "remix", "kudos-boost"];
  const kind = kinds[hashStr(`${id}:${day}`) % kinds.length];
  const skill = (missing || [])[hashStr(`${id}:${day}:s`) % Math.max(1, (missing || []).length)] || "your top skill";
  const map = {
    insight: { title: "Today's edge", sub: quizBest > 0 ? `Quiz best ${quizBest} already lifts MAIN. 1 quest pair = +proof.` : "Quiz first — 30% of MAIN for ~5 minutes." },
    spotlight: { title: `Spotlight: ${skill}`, sub: "Finish its quest pair → verified tick on your portfolio." },
    remix: { title: "Remix drill", sub: questPairs > 0 ? `${questPairs} verified. Next pair adds +20 proof (cap 100).` : "Course + project + proof link = 1 verified pair." },
    "kudos-boost": { title: "Showcase nudge", sub: main >= 50 ? "Silver+ reads as real. Share portfolio, collect kudos." : "Hit Silver (50) — portfolios below it get skipped." },
  };
  return { kind, ...map[kind] };
}
