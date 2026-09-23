const fs = require('fs');
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) { console.error('usage: node ua-arch-analyze.js <input> <output>'); process.exit(1); }
const { fileNodes, importEdges, allEdges } = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const byId = {};
fileNodes.forEach(n => { byId[n.id] = n; });
const pathOf = id => (byId[id] ? byId[id].filePath : id.replace(/^(file|config|document|service|pipeline|table|schema|resource|endpoint):/, ''));

// A. Directory grouping (common prefix then first segment after it)
function commonPrefix(paths) {
  if (!paths.length) return '';
  const split = paths.map(p => p.split('/'));
  let i = 0;
  while (split.every(s => s.length > i + 1 && s[i] === split[0][i])) i++;
  return split[0].slice(0, i).join('/') + (i ? '/' : '');
}
const paths = fileNodes.map(n => n.filePath);
const prefix = commonPrefix(paths);
const directoryGroups = {};
fileNodes.forEach(n => {
  const rest = n.filePath.startsWith(prefix) ? n.filePath.slice(prefix.length) : n.filePath;
  let group;
  if (rest.includes('/')) group = rest.split('/')[0];
  else {
    if (/(^|\.)(test|spec)\./.test(rest) || /^test_/.test(rest)) group = 'tests';
    else if (/config|\.toml$|\.yaml$|\.yml$|package\.json$|vercel\.json$|\.env/.test(rest)) group = 'config';
    else if (/\.md$/.test(rest)) group = 'docs';
    else group = 'root';
  }
  (directoryGroups[group] = directoryGroups[group] || []).push(n.id);
});

// B. Node type grouping
const nodeTypeGroups = {};
fileNodes.forEach(n => { (nodeTypeGroups[n.type] = nodeTypeGroups[n.type] || []).push(n.id); });

// C. Fan-in / fan-out
const fileFanIn = {}, fileFanOut = {};
importEdges.forEach(e => {
  fileFanOut[e.source] = (fileFanOut[e.source] || 0) + 1;
  fileFanIn[e.target] = (fileFanIn[e.target] || 0) + 1;
});
const groupOf = id => Object.keys(directoryGroups).find(g => directoryGroups[g].includes(id));
const groupImportsFrom = {}, groupImportedBy = {};
Object.keys(directoryGroups).forEach(g => { groupImportsFrom[g] = new Set(); groupImportedBy[g] = new Set(); });
importEdges.forEach(e => {
  const f = groupOf(e.source), t = groupOf(e.target);
  if (f && t && f !== t) { groupImportsFrom[f].add(t); groupImportedBy[t].add(f); }
});

// D. Cross-category edges
const cc = {};
allEdges.forEach(e => {
  const a = byId[e.source], b = byId[e.target];
  if (!a || !b) return;
  const k = a.type + '|' + b.type + '|' + e.type;
  cc[k] = (cc[k] || 0) + 1;
});
const crossCategoryEdges = Object.entries(cc).map(([k, count]) => {
  const [fromType, toType, edgeType] = k.split('|');
  return { fromType, toType, edgeType, count };
}).sort((a, b) => b.count - a.count);

// E. Inter-group import frequency
const ig = {};
importEdges.forEach(e => {
  const f = groupOf(e.source), t = groupOf(e.target);
  if (!f || !t || f === t) return;
  const k = f + '|' + t;
  ig[k] = (ig[k] || 0) + 1;
});
const interGroupImports = Object.entries(ig).map(([k, count]) => {
  const [from, to] = k.split('|');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// F. Intra-group density
const intraGroupDensity = {};
Object.keys(directoryGroups).forEach(g => {
  const set = new Set(directoryGroups[g]);
  let internal = 0, total = 0;
  importEdges.forEach(e => {
    if (set.has(e.source) || set.has(e.target)) {
      total++;
      if (set.has(e.source) && set.has(e.target)) internal++;
    }
  });
  intraGroupDensity[g] = { internalEdges: internal, totalEdges: total, density: total ? +(internal / total).toFixed(3) : 0 };
});

// G. Pattern matching
const dirPatterns = [
  [/^(routes?|api|controllers?|endpoints?|handlers?|routers?|blueprints?|serializers?)$/, 'api'],
  [/^(services?|core|lib|domain|logic|internal|composables|mailers|jobs|channels|signals)$/, 'service'],
  [/^(models?|db|data|persistence|repositor|entities|entity|sql|database|schemas?|migrations?)$/, 'data'],
  [/^(components?|views?|pages?|ui|layouts?|screens?)$/, 'ui'],
  [/^(middleware|plugins?|interceptors?|guards?)$/, 'middleware'],
  [/^(utils?|helpers?|common|shared|tools?|pkg)$/, 'utility'],
  [/^(config|constants?|env|settings?|management|commands?)$/, 'config'],
  [/^(__tests__|tests?|specs?)$/, 'test'],
  [/^(types?|interfaces?|contracts?|dtos?|dto|requests?|responses?)$/, 'types'],
  [/^hooks?$/, 'hooks'],
  [/^(store|state|reducers?|actions?|slices?|app|ayush)$/, 'state'],
  [/^(assets?|static|public)$/, 'assets'],
  [/^(docs?|documentation|wiki)$/, 'documentation'],
  [/^(deploy|deployment|infra|infrastructure|k8s|kubernetes|helm|charts?|terraform|tf|docker|scripts?)$/, 'infrastructure'],
  [/^(\.github|\.gitlab|\.circleci)$/, 'ci-cd'],
  [/^(src|entrys?|cmd|bin)$/, 'entry'],
];
function matchFilePattern(fp) {
  const base = fp.split('/').pop();
  if (/(\.test\.|\.spec\.|^test_)/.test(base)) return 'test';
  if (/\.d\.ts$/.test(base)) return 'types';
  if (/^(index\.(ts|js|jsx|tsx)|__init__\.py|main\.go|main\.rs|lib\.rs|Application\.java|Program\.cs|config\.ru|manage\.py)$/.test(base)) return 'entry';
  if (/^(Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle|composer\.json|package\.json|vercel\.json|\.oxlintrc\.json)$/.test(base)) return 'config';
  if (/^\.env/.test(base)) return 'config';
  if (/^Dockerfile/.test(base) || /^docker-compose/.test(base)) return 'infrastructure';
  if (/\.tf(vars)?$/.test(base)) return 'infrastructure';
  if (/\.github\/workflows\//.test(fp) || /^\.gitlab-ci\.yml$/.test(base) || /^Jenkinsfile$/.test(base)) return 'ci-cd';
  if (/\.sql$/.test(base)) return 'data';
  if (/\.(graphql|gql|proto)$/.test(base)) return 'types';
  if (/\.(md|rst)$/.test(base)) return 'documentation';
  if (/^Makefile$/.test(base)) return 'infrastructure';
  if (/\.mjs$/.test(base)) return 'infrastructure';
  if (/\.webmanifest$/.test(base) || /^sw\.js$/.test(base)) return 'infrastructure';
  if (/\.css$/.test(base)) return 'ui';
  if (/^index\.html$/.test(base) || /\.html$/.test(base)) return 'entry';
  return null;
}
const patternMatches = {};
Object.keys(directoryGroups).forEach(g => {
  for (const [re, label] of dirPatterns) if (re.test(g)) { patternMatches[g] = label; break; }
  if (!patternMatches[g]) {
    const votes = {};
    directoryGroups[g].forEach(id => {
      const m = matchFilePattern(byId[id].filePath);
      if (m) votes[m] = (votes[m] || 0) + 1;
    });
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= Math.ceil(directoryGroups[g].length / 2)) patternMatches[g] = top[0];
  }
});

// H. Deployment topology
const allPaths = fileNodes.map(n => n.filePath);
const has = re => allPaths.some(p => re.test(p));
const infraFiles = allPaths.filter(p => /Dockerfile|docker-compose|vercel\.json|\.github\/workflows|k8s|terraform|\.tf$|sw\.js|manifest\.webmanifest|vite\.config|index\.html/.test(p));
const deploymentTopology = {
  hasDockerfile: has(/Dockerfile/),
  hasCompose: has(/docker-compose/),
  hasK8s: has(/k8s|kubernetes/),
  hasTerraform: has(/\.tf$/),
  hasCI: has(/\.github\/workflows|\.gitlab-ci|Jenkinsfile/),
  infraFiles
};

// I. Data pipeline
const dataPipeline = { schemaFiles: [], migrationFiles: [], dataModelFiles: [], apiHandlerFiles: [] };
fileNodes.forEach(n => {
  const p = n.filePath;
  if (/\.(sql|graphql|gql|proto|prisma)$/.test(p)) dataPipeline.schemaFiles.push(p);
  if (/migrations?\//.test(p)) dataPipeline.migrationFiles.push(p);
  if (/^(src\/(data|ayush)\/|src\/lib\/(quests|score|cohort|roadmapGenerator|match)\.(js|jsx))/.test(p)) dataPipeline.dataModelFiles.push(p);
  if (/src\/pages\//.test(p)) dataPipeline.apiHandlerFiles.push(p);
});

// J. Doc coverage
const docGroups = new Set();
fileNodes.forEach(n => { if (/\.(md|rst)$/.test(n.filePath)) { const g = groupOf(n.id); if (g) docGroups.add(g); } });
const groupNames = Object.keys(directoryGroups);
const docCoverage = {
  groupsWithDocs: docGroups.size,
  totalGroups: groupNames.length,
  coverageRatio: groupNames.length ? +(docGroups.size / groupNames.length).toFixed(2) : 0,
  undocumentedGroups: groupNames.filter(g => !docGroups.has(g))
};

// K. Dependency direction
const pairCounts = {};
importEdges.forEach(e => {
  const f = groupOf(e.source), t = groupOf(e.target);
  if (!f || !t || f === t) return;
  pairCounts[f + '|' + t] = (pairCounts[f + '|' + t] || 0) + 1;
});
const seen = new Set(), dependencyDirection = [];
Object.keys(pairCounts).forEach(k => {
  if (seen.has(k)) return;
  const [a, b] = k.split('|');
  const rev = b + '|' + a;
  seen.add(k); seen.add(rev);
  const ab = pairCounts[k] || 0, ba = pairCounts[rev] || 0;
  if (ab >= ba) dependencyDirection.push({ dependent: a, dependsOn: b });
  else dependencyDirection.push({ dependent: b, dependsOn: a });
});

// fileStats
const nodeTypeCounts = {};
fileNodes.forEach(n => { nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1; });
const filesPerGroup = {};
Object.keys(directoryGroups).forEach(g => { filesPerGroup[g] = directoryGroups[g].length; });

fs.writeFileSync(outputPath, JSON.stringify({
  scriptCompleted: true,
  directoryGroups, nodeTypeGroups, crossCategoryEdges, interGroupImports,
  intraGroupDensity, patternMatches, deploymentTopology, dataPipeline,
  docCoverage, dependencyDirection,
  fileStats: { totalFileNodes: fileNodes.length, filesPerGroup, nodeTypeCounts },
  fileFanIn, fileFanOut
}, null, 2));
console.log('wrote ' + outputPath);
