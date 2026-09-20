// ayush feed: CCRAS vacancies + strict-gated Arbeitnow → src/ayush/feed.js.
// ponytail: scrape tolerant HTML (regex anchors), every source best-effort.
// total failure → keep previous feed file (never blank the portal).
// usage: npm run ayush:feed [--max=30]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "ayush", "feed.js");
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.replace(/^--/, "").split("=");
  return [m[0], m[1] ?? true];
}));
const MAX = Math.min(60, Math.max(5, Number(args.max) || 30));
const UA = { "User-Agent": "avsar-sih26044-feed/1.0" };

async function get(url, ms = 25000) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const clean = (s = "") => String(s).replace(/&amp;/g, "&").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const hash = (s = "") => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};

const SKILL_HINTS = [
  ["pharmacy", ["pharmacy", "pharmacopoeia", "drug", "formulation", "tablet", "churna", "vati"]],
  ["gmp", ["gmp", "manufacturing", "quality", "standardisation", "standardization"]],
  ["research", ["research", "fellow", "jrf", "srf", "project", "spark", "study"]],
  ["panchakarma", ["panchakarma", "snehana", "swedana", "vamana", "nasya", "technician"]],
  ["dravyaguna", ["dravyaguna", "herb", "plant", "dravya", "nmpb"]],
  ["diagnosis", ["clinical", "opd", "ipd", "diagnos", "vaidya", "medical officer"]],
  ["documentation", ["walk", "interview", "advertisement", "vacanc", "recruit", "application"]],
  ["hims", ["hims", "digital", "data entry", "e-logbook"]],
];

function skillsFor(title = "") {
  const t = ` ${title.toLowerCase()} `;
  const out = SKILL_HINTS.filter(([, hints]) => hints.some((h) => t.includes(h))).map(([s]) => s);
  return [...new Set(out)].slice(0, 5);
}

function kindFor(title = "", url = "") {
  const t = `${title} ${url}`.toLowerCase();
  if (/fellow|phd|post.doctoral|spark/.test(t)) return "fellowship";
  if (/technician|course|training/.test(t)) return "training";
  if (/intern/.test(t)) return "Internship";
  return "research";
}

// --- source 1: CCRAS vacancies (official, walk-ins + fellowships) ---
async function fetchCcras() {
  const html = await get("https://ccras.nic.in/vacancies/");
  const jobs = [];
  const notices = [];
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]{12,180})<\/a>/g)) {
    const url = m[1].trim();
    const title = clean(m[2]);
    if (!/walk|interview|fellow|recruit|vacanc|jrf|srf|pharma|advertisement|post|scheme/i.test(`${title} ${url}`)) continue;
    if (!/^https?:\/\//.test(url) || /wp-content\/uploads.*\.(css|js|png|jpg)/i.test(url)) continue;
    if (/ipc\.gov\.in/i.test(url)) continue;
    // ponytail: students only — drop senior/admin/deputation posts, keep training + research + walk-ins
    if (/director general|private secretary|stenographer|accountant|clerk|deputation|driver|peon|assistant registrar/i.test(title)) continue;
    const date = (title.match(/(\d{2}\.\d{2}\.\d{4})/) || [])[1] || "";
    jobs.push({
      id: `feed-ccras-${hash(url)}`,
      role: "ayush",
      title: title.slice(0, 120),
      company: /fellow/i.test(title) ? "CCRAS fellowship" : "CCRAS institute",
      loc: /cheruthuruthy|kerala/i.test(title) ? "Kerala" : /delhi|hqrs|headquarters/i.test(title) ? "New Delhi" : "Pan India",
      type: /walk|interview/i.test(title) ? "Full-time" : "Govt",
      skills: skillsFor(title),
      minScore: /fellow|jrf|srf/i.test(title) ? 55 : 35,
      apply: url,
      stipend: /fellow/i.test(title) ? "see official scheme" : "",
      deadline: date ? `see notice (${date})` : "see official notice",
      kind: kindFor(title, url),
      src: "ccras",
    });
    if (notices.length < 8 && /walk|fellow|advertisement|scheme/i.test(title)) {
      notices.push({ id: `fn-${hash(url)}`, tag: "ccras", text: title.slice(0, 110), url });
    }
  }
  return { jobs, notices };
}

// --- source 3: ayush news (google news rss, in-en) ---
function decodeEntities(s = "") {
  return String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function parseNewsRss(xml = "") {
  const items = [];
  for (const m of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = m[1];
    const title = decodeEntities((body.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").trim();
    const link = (((body.match(/<source[^>]*url="([^"]+)"/) || [])[1] || (body.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "")).trim();
    const source = decodeEntities((body.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "").trim();
    const pub = ((body.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "").trim();
    if (!title || title.startsWith('"ayush ministry')) continue;
    if (!/ayush|ayurveda|yoga|unani|siddha|homeopathy|panchakarma|naturopathy/i.test(title)) continue;
    items.push({ title: title.slice(0, 140), url: link, source: source.slice(0, 40) || "news", at: pub });
    if (items.length >= 12) break;
  }
  return items;
}

async function fetchNews() {
  const xml = await get("https://news.google.com/rss/search?q=ayush%20ayurveda%20ministry%20when:30d&hl=en-IN&gl=IN&ceid=IN:en");
  return {
    jobs: [],
    notices: [],
    news: parseNewsRss(xml).map((n) => ({ id: `news-${hash(n.title)}`, ...n })),
  };
}

// --- source 2: Arbeitnow, strict ayush gate only ---
async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api", { headers: UA, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const jobs = [];
  for (const j of data.data || []) {
    const text = `${j.title || ""} ${(j.tags || []).join(" ")}`;
    if (!/ayur|herbal|panchakarma|\byoga\b|wellness retreat|ayush/i.test(text)) continue;
    const skills = skillsFor(text);
    if (!skills.length) continue;
    jobs.push({
      id: `feed-arbeit-${j.slug || hash(text)}`,
      role: "ayush",
      title: String(j.title || "").slice(0, 120),
      company: j.company_name || "Remote co",
      loc: j.remote ? "Remote" : (j.location || "Remote"),
      type: "Full-time",
      skills,
      minScore: 40,
      apply: j.url || "#",
      stipend: "",
      deadline: "",
      kind: "research",
      src: "arbeitnow",
    });
  }
  return { jobs, notices: [] };
}

const seen = new Set();
const jobs = [];
const notices = [];
for (const [name, fn] of [["ccras", fetchCcras], ["arbeitnow", fetchArbeitnow], ["news", fetchNews]]) {
  try {
    const r = await fn();
    let added = 0;
    for (const j of (r.jobs || []).slice(0, MAX)) {
      const k = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (!j.skills.length) j.skills = ["research", "documentation"];
      jobs.push(j);
      added++;
    }
    for (const n of r.notices || []) {
      if (notices.some((x) => x.url === n.url)) continue;
      notices.push(n);
    }
    console.log(`${name}: ${added} jobs, ${r.notices?.length || 0} notices`);
  } catch (e) {
    console.error(`${name}: FAILED (${e.message})`);
  }
}

if (!jobs.length && !notices.length) {
  console.log("feed: all sources failed, keeping previous file.");
  process.exit(existsSync(OUT) ? 0 : 1);
}

const out =
  `// auto-generated by npm run ayush:feed — do not hand-edit.\n` +
  `// ${jobs.length} postings + ${notices.length} notices · ${new Date().toISOString().slice(0, 10)}.\n` +
  `/* eslint-disable */\n` +
  `export const AYUSH_FEED_JOBS = ${JSON.stringify(jobs, null, 2)};\n` +
  `export const AYUSH_FEED_NOTICES = ${JSON.stringify(notices, null, 2)};\n` +
  `export const AYUSH_FEED_AT = ${JSON.stringify(new Date().toISOString().slice(0, 10))};\n`;
writeFileSync(OUT, out);
console.log(`feed: ${jobs.length} jobs + ${notices.length} notices → src/ayush/feed.js`);
