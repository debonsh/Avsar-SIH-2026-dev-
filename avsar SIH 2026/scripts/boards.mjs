// boards import: Greenhouse + Lever + Ashby company boards → app/src/data/boardsSeed.js.
// ponytail: keyless JSON APIs only (same as JobSync's registry), node has no CORS limits.
// Company directories vendored under scripts/vendor/ (from JobSync's built-in lists).
// usage: npm run boards [--gh=a,b] [--lever=a,b] [--ashby=a,b] [--max=40]
//        no flags = DEFAULT_TOKENS below, so a bare run is broad instead of reproducing
//        whichever two companies were passed by hand last time.
// postedAt: each provider already returns its own posted date (Greenhouse updated_at,
// Lever createdAt, Ashby publishedAt) and all three used to be thrown away, which left
// every staleness and trend claim in the app unprovable.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guessRole, extractSkills, laneOfRole } from "../src/lib/store.js";
import { toIso } from "../src/lib/dates.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.replace(/^--/, "").split("=");
  return [m[0], m[1] ?? true];
}));
const MAX = Math.min(200, Math.max(5, Number(args.max) || 40));
const split = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

const loadList = (f) => JSON.parse(readFileSync(join(HERE, "vendor", f), "utf8"));
const LISTS = { gh: loadList("greenhouse.json"), lever: loadList("lever.json"), ashby: loadList("ashby.json") };

// resolve a name or token to {name, token, host}
function resolve(provider, want) {
  const list = LISTS[provider];
  const hit = list.find((c) => c.token.toLowerCase() === want.toLowerCase())
    || list.find((c) => c.name.toLowerCase().includes(want.toLowerCase()));
  return hit ? { name: hit.name, token: hit.token, host: hit.host } : { name: want, token: want };
}

async function get(url, ms = 20000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const strip = (s = "") => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const locOf = (...parts) => parts.find((p) => p && String(p).trim()) || "Remote";
// Ashby sends secondaryLocations as objects, and the old join() wrote "[object Object]"
// straight into the seed (that string is still baked into boardsSeed.js at line 540).
const locName = (l) => (typeof l === "string" ? l : l?.location || l?.address?.addressLocality || "");
const typeOf = (t = "") => /intern|trainee|apprentice|new grad/i.test(t) ? "Internship" : "Full-time";

function toShape(prefix, raw, company, map) {
  const m = map(raw);
  if (!m.title) return null;
  const text = `${m.title} ${m.desc}`;
  const role = guessRole(text);
  if (!role) return null; // ponytail: unmapped → dropped, same rule as live feed
  const postedAt = toIso(m.postedAt);
  return {
    id: `${prefix}-${m.id}`,
    role,
    lane: laneOfRole(role), // derived from the role, so an ayush title can never be mislabelled
    title: m.title.trim().slice(0, 120),
    company,
    loc: String(m.loc || "Remote").slice(0, 60),
    type: typeOf(`${m.title} ${m.employment || ""}`),
    skills: extractSkills(text),
    minScore: 45,
    apply: m.url || "#",
    description: strip(m.desc).slice(0, 600),
    src: prefix,
    ...(postedAt ? { postedAt } : {}),
  };
}

async function fetchGreenhouse({ name, token }) {
  const d = await get(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`);
  return (d.jobs || []).slice(0, MAX).map((j) => toShape("gh", j, name, (x) => ({
    id: x.id, title: x.title, loc: locOf(x.location?.name), url: x.absolute_url,
    desc: x.content || "", employment: (x.metadata || []).map((m) => m.value).join(" "),
    postedAt: x.updated_at,
  })));
}

async function fetchLeverBoard({ name, token, host }) {
  const hosts = host === "eu"
    ? ["https://api.eu.lever.co/v0/postings"]
    : ["https://api.lever.co/v0/postings", "https://api.eu.lever.co/v0/postings"];
  let lastErr;
  for (const base of hosts) {
    try {
      const d = await get(`${base}/${encodeURIComponent(token)}?mode=json&limit=50`);
      return (Array.isArray(d) ? d : []).slice(0, MAX).map((j) => toShape("lever", j, name, (x) => ({
        id: x.id, title: x.text, loc: locOf((x.categories?.allLocations || []).join("/"), x.categories?.location),
        url: x.hostedUrl, desc: [x.descriptionPlain, (x.lists || []).map((l) => l.content).join(" ")].join(" "),
        employment: x.categories?.commitment,
        postedAt: x.createdAt, // epoch ms
      })));
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function fetchAshby({ name, token }) {
  const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`);
  return (d.jobs || []).filter((j) => j.isListed !== false).slice(0, MAX).map((j) => toShape("ashby", j, name, (x) => ({
    id: x.id, title: x.title, loc: locOf(x.locationName, (x.secondaryLocations || []).map(locName).filter(Boolean).join("/")),
    url: x.jobUrl, desc: x.descriptionPlain || x.descriptionHtml || "", employment: x.employmentType,
    postedAt: x.publishedAt,
  })));
}

// A bare run used to be a usage error, so what shipped was whatever two companies were
// passed by hand: 49 postings from Stripe and Linear, Lever at zero. Market signals
// computed from two companies are not a market, so a bare run now spreads wider.
const DEFAULT_TOKENS = {
  gh: ["stripe", "figma", "databricks", "gitlab", "cloudflare", "discord", "reddit", "robinhood"],
  lever: ["lever", "gopuff", "kraken", "matchgroup", "plaid"],
  ashby: ["linear", "openai", "ramp", "notion", "vanta", "posthog"],
};
const targetsFor = (provider, flag) => {
  const given = split(args[flag]);
  return (given.length ? given : DEFAULT_TOKENS[provider]).map((w) => ({
    p: provider, c: resolve(provider, w), fn: { gh: fetchGreenhouse, lever: fetchLeverBoard, ashby: fetchAshby }[provider],
  }));
};

const TARGETS = [
  ...targetsFor("gh", "gh"),
  ...targetsFor("lever", "lever"),
  ...targetsFor("ashby", "ashby"),
];

if (TARGETS.every((t) => !t.c.token)) {
  console.log("usage: npm run boards [--gh=a,b] [--lever=a,b] [--ashby=a,b] [--max=40]");
  process.exit(1);
}

const seen = new Set();
const jobs = [];
for (const t of TARGETS) {
  try {
    const rows = (await t.fn(t.c)).filter(Boolean);
    let added = 0;
    for (const j of rows) {
      const k = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      jobs.push(j);
      added++;
    }
    console.log(`${t.p}/${t.c.name}: ${rows.length} fetched, ${added} kept`);
  } catch (e) {
    console.error(`${t.p}/${t.c.name}: FAILED (${e.message})`);
  }
}

// never clobber a good seed with an empty one: a dead network or a bad token list
// would otherwise silently halve the corpus the whole app reads.
if (!jobs.length) {
  console.error("boards: 0 postings kept, leaving src/data/boardsSeed.js untouched.");
  process.exit(1);
}

const names = TARGETS.map((t) => `${t.p}:${t.c.name}`).join(", ");
const out = `// auto-generated by npm run boards -- do not hand-edit.\n// boards: ${names} · ${jobs.length} kept (per-board cap ${MAX}) · ${new Date().toISOString().slice(0, 10)}.\n/* eslint-disable */\nexport const BOARDS_JOBS = ${JSON.stringify(jobs, null, 2)};\n`;
writeFileSync(join(HERE, "..", "src", "data", "boardsSeed.js"), out);
console.log(`boards: ${jobs.length} jobs → app/src/data/boardsSeed.js`);
