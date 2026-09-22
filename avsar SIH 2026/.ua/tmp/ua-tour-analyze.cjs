const fs = require('fs');
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) { console.error('usage: node ua-tour-analyze.js <input> <output>'); process.exit(1); }
let data;
try { data = JSON.parse(fs.readFileSync(inputPath, 'utf8')); }
catch (e) { console.error('failed to read input: ' + e.message); process.exit(1); }
const nodes = data.nodes || [], edges = data.edges || [], layers = data.layers || [];
const byId = new Map(nodes.map(n => [n.id, n]));

// A. fan-in, B. fan-out
const fanIn = new Map(nodes.map(n => [n.id, 0]));
const fanOut = new Map(nodes.map(n => [n.id, 0]));
for (const e of edges) {
  if (!byId.has(e.source) || !byId.has(e.target)) continue;
  fanOut.set(e.source, fanOut.get(e.source) + 1);
  fanIn.set(e.target, fanIn.get(e.target) + 1);
}
const fanInRanking = [...fanIn.entries()].map(([id, fanIn]) => ({ id, fanIn, name: byId.get(id).name }))
  .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
const fanOutRanking = [...fanOut.entries()].map(([id, fanOut]) => ({ id, fanOut, name: byId.get(id).name }))
  .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

// C. entry point candidates
const ENTRY_NAMES = new Set(['index.ts','index.js','main.ts','main.js','main.jsx','app.ts','app.js','app.jsx','server.ts','server.js','mod.rs','main.go','main.py','main.rs','manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py','Application.java','Main.java','Program.cs','config.ru','index.php','App.swift','Application.kt','main.cpp','main.c']);
const inVals = [...fanIn.values()].sort((a, b) => a - b);
const outVals = [...fanOut.values()].sort((a, b) => a - b);
const p75out = outVals[Math.floor(outVals.length * 0.9)] ?? Infinity;
const p25in = inVals[Math.floor(inVals.length * 0.25)] ?? 0;
const scored = [];
for (const n of nodes) {
  let score = 0;
  if (n.type === 'document') {
    const fp = (n.filePath || n.name || '').replace(/\\/g, '/');
    if (/^README\.md$/i.test(n.name) && !fp.includes('/')) score += 5;
    else if (/\.md$/i.test(n.name) && !fp.includes('/')) score += 2;
    if (score > 0) scored.push({ id: n.id, score, name: n.name, summary: n.summary || '' });
    continue;
  }
  if (n.type !== 'file') continue;
  const base = (n.filePath || n.name || '').split('/').pop();
  if (ENTRY_NAMES.has(base)) score += 3;
  const depth = (n.filePath || '').split('/').length;
  if (depth <= 2) score += 1;
  if ((fanOut.get(n.id) ?? 0) >= p75out) score += 1;
  if ((fanIn.get(n.id) ?? 0) <= p25in) score += 1;
  scored.push({ id: n.id, score, name: n.name, summary: n.summary || '' });
}
scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
const entryPointCandidates = scored.slice(0, 5);

// D. BFS from top code entry point
const adj = new Map(nodes.map(n => [n.id, []]));
for (const e of edges) {
  if (e.type !== 'imports' && e.type !== 'calls' && e.type !== 'depends_on') continue;
  if (byId.has(e.source) && byId.has(e.target)) adj.get(e.source).push(e.target);
}
const codeStart = entryPointCandidates.find(c => byId.get(c.id).type === 'file') || entryPointCandidates[0];
const startNode = codeStart ? codeStart.id : nodes[0].id;
const depthMap = { [startNode]: 0 };
const order = [startNode];
const queue = [startNode];
while (queue.length) {
  const cur = queue.shift();
  for (const nxt of adj.get(cur) || []) {
    if (!(nxt in depthMap)) { depthMap[nxt] = depthMap[cur] + 1; order.push(nxt); queue.push(nxt); }
  }
}
const byDepth = {};
for (const [id, d] of Object.entries(depthMap)) { (byDepth[d] = byDepth[d] || []).push(id); }

// E. non-code inventory
const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
for (const n of nodes) {
  const item = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
  if (n.type === 'document') nonCodeFiles.documentation.push(item);
  else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(item);
  else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(item);
  else if (n.type === 'config') nonCodeFiles.config.push(item);
}

// F. tightly coupled clusters (bidirectional pairs, expanded)
const fwd = new Map();
for (const e of edges) {
  if (e.type !== 'imports' && e.type !== 'calls' && e.type !== 'depends_on') continue;
  const k = e.source + '' + e.target;
  fwd.set(k, (fwd.get(k) || 0) + 1);
}
const pairs = [];
for (const k of fwd.keys()) {
  const [a, b] = k.split('');
  if (a !== b && fwd.has(b + '' + a)) pairs.push([a, b].sort().join(''));
}
const uniqPairs = [...new Set(pairs)];
const parent = new Map();
const find = x => { if (!parent.has(x)) parent.set(x, x); let r = x; while (parent.get(r) !== r) r = parent.get(r); return r; };
for (const p of uniqPairs) { const [a, b] = p.split(''); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); }
const groups = new Map();
for (const p of uniqPairs) for (const m of p.split('')) { const r = find(m); if (!groups.has(r)) groups.set(r, new Set()); groups.get(r).add(m); }
// expand: add nodes connected to 2+ members
for (const [, set] of groups) {
  for (const n of nodes) {
    if (set.has(n.id)) continue;
    let links = 0;
    for (const m of set) if (fwd.has(n.id + '' + m) || fwd.has(m + '' + n.id)) links++;
    if (links >= 2) set.add(n.id);
  }
}
const clusters = [...groups.values()]
  .map(set => {
    const arr = [...set].slice(0, 5);
    let edgeCount = 0;
    for (const a of arr) for (const b of arr) if (fwd.has(a + '' + b)) edgeCount += fwd.get(a + '' + b);
    return { nodes: arr, edgeCount };
  })
  .sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 10);

// G. layers, H. summary index
const nodeSummaryIndex = {};
for (const n of nodes) nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' };

const out = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking, fanOutRanking,
  bfsTraversal: { startNode, order, depthMap, byDepth },
  nonCodeFiles, clusters,
  layers: { count: layers.length, list: layers },
  nodeSummaryIndex,
  totalNodes: nodes.length, totalEdges: edges.length
};
fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
console.log('wrote ' + outputPath + ' nodes=' + nodes.length + ' edges=' + edges.length);
