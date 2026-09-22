const fs = require('fs');
const N = [], E = [];
const f = (id, name, filePath, summary, tags, complexity) =>
  N.push({ id, type: 'file', name, filePath, summary, tags, complexity });
const fn = (path, name, lineRange, summary, tags, complexity, exported) => {
  const id = `function:${path}:${name}`;
  N.push({ id, type: 'function', name, filePath: path, lineRange, summary, tags, complexity });
  E.push({ source: `file:${path}`, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
  if (exported) E.push({ source: `file:${path}`, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
};
const imp = (from, to) =>
  E.push({ source: `file:${from}`, target: `file:${to}`, type: 'imports', direction: 'forward', weight: 0.7 });
const call = (from, to) =>
  E.push({ source: `file:${from}`, target: to, type: 'calls', direction: 'forward', weight: 0.8 });

// ---- file nodes ----
f('file:src/components/StreakMeter.jsx', 'StreakMeter.jsx', 'src/components/StreakMeter.jsx', 'GitHub-style activity heatmap showing daily quest activity, current streak, and total active days.', ['component', 'streak', 'heatmap', 'activity', 'gamification'], 'moderate');
f('file:src/components/XpMeter.jsx', 'XpMeter.jsx', 'src/components/XpMeter.jsx', 'XP progress bar showing level, total XP, and per-source breakdown toward the next level.', ['component', 'xp', 'gamification', 'progress'], 'simple');
f('file:src/lib/onboarding.js', 'onboarding.js', 'src/lib/onboarding.js', 'Onboarding helpers: weighted progress, profile-derived questions, reset, and AI grade parsing.', ['utility', 'onboarding', 'questionnaire', 'profile'], 'moderate');
f('file:src/lib/progress.js', 'progress.js', 'src/lib/progress.js', 'LocalStorage-backed quest progress store: completion flags, evidence URLs, daily activity, streaks, badges, and role mastery.', ['service', 'progress', 'storage', 'streak', 'gamification'], 'moderate');
f('file:src/lib/streak.js', 'streak.js', 'src/lib/streak.js', 'Daily activity aggregation: per-day detail and counts, heatmap weeks, streak length, and intensity levels.', ['utility', 'streak', 'heatmap', 'activity', 'analytics'], 'moderate');
f('file:src/lib/xp.js', 'xp.js', 'src/lib/xp.js', 'XP weights, level thresholds, and XP collection from daily activity detail.', ['utility', 'xp', 'gamification', 'level'], 'simple');
f('file:src/pages/Home.jsx', 'Home.jsx', 'src/pages/Home.jsx', 'Landing dashboard with score ring, streak and XP meters, stats, skill gaps, courses, and top job matches.', ['page', 'dashboard', 'score', 'jobs'], 'complex');
f('file:src/pages/Profile.jsx', 'Profile.jsx', 'src/pages/Profile.jsx', 'Multi-step onboarding wizard plus profile card with score, streak, XP, skill gaps, auth, and account actions.', ['page', 'onboarding', 'profile', 'authentication'], 'complex');
f('file:tests/onboarding.test.js', 'onboarding.test.js', 'tests/onboarding.test.js', 'Tests for onboarding progress weighting, question generation, and AI grade parsing.', ['test', 'onboarding', 'questionnaire', 'validation', 'unit'], 'simple');
f('file:tests/streak.test.js', 'streak.test.js', 'tests/streak.test.js', 'Tests for streak heatmap levels, streak counting, and active-day totals.', ['test', 'streak', 'heatmap', 'validation', 'unit'], 'simple');
f('file:tests/xp.test.js', 'xp.test.js', 'tests/xp.test.js', 'Tests for XP level thresholds and XP collection weights.', ['test', 'xp', 'level', 'validation'], 'simple');

// ---- function nodes ----
fn('src/components/StreakMeter.jsx', 'StreakMeter', [18, 89], 'Renders a GitHub-style activity heatmap with streak count, active days, and per-day tooltips.', ['component', 'streak', 'heatmap', 'activity', 'gamification'], 'moderate', true);
fn('src/components/XpMeter.jsx', 'XpMeter', [10, 58], 'Renders total XP, level progress bar, and per-source XP breakdown.', ['component', 'xp', 'level', 'progress'], 'simple', true);
fn('src/lib/onboarding.js', 'onboardingProgress', [10, 15], 'Computes weighted onboarding completion percentage from profile fields.', ['utility', 'onboarding', 'progress'], 'simple', true);
fn('src/lib/onboarding.js', 'questionsFromProfile', [39, 54], 'Builds a short personalized question list from profile skills and resume gaps.', ['utility', 'onboarding', 'questionnaire'], 'simple', true);
fn('src/lib/onboarding.js', 'resetOnboarding', [62, 67], 'Clears onboarding storage keys to restart the wizard.', ['utility', 'onboarding', 'reset'], 'simple', true);
fn('src/lib/onboarding.js', 'parseAiGrade', [70, 75], 'Parses a numeric grade from raw AI output, clamped 0-100.', ['utility', 'parsing', 'ai-grading'], 'simple', true);
fn('src/lib/progress.js', 'load', [19, 31], 'Loads progress state from storage, migrating day keys and reseeding when stale.', ['utility', 'storage', 'progress'], 'simple', false);
fn('src/lib/progress.js', 'todayISO', [37, 40], "Returns today's date as YYYY-MM-DD.", ['utility', 'date', 'formatting'], 'simple', true);
fn('src/lib/progress.js', 'yesterdayISO', [42, 46], "Returns yesterday's date as YYYY-MM-DD.", ['utility', 'date', 'formatting'], 'simple', true);
fn('src/lib/progress.js', 'getProgress', [48, 48], 'Returns the full progress state object.', ['utility', 'progress', 'storage'], 'simple', true);
fn('src/lib/progress.js', 'questSnapshot', [52, 55], 'Returns the quest completion map for a role branch.', ['utility', 'quest', 'progress'], 'simple', true);
fn('src/lib/progress.js', 'isCourseDone', [57, 59], 'Checks whether a course quest is marked done.', ['utility', 'quest', 'progress'], 'simple', true);
fn('src/lib/progress.js', 'isProjectDone', [61, 63], 'Checks whether a project quest is marked done.', ['utility', 'quest', 'progress'], 'simple', true);
fn('src/lib/progress.js', 'isSkillComplete', [65, 69], 'Checks whether all quests for a skill are complete with evidence.', ['utility', 'quest', 'evidence'], 'simple', true);
fn('src/lib/progress.js', 'setQuestDone', [71, 81], "Marks a quest done or undone and stamps today's activity.", ['utility', 'progress', 'quest', 'activity'], 'simple', true);
fn('src/lib/progress.js', 'getEvidence', [84, 86], 'Returns the evidence URL for a skill quest.', ['utility', 'evidence', 'quest'], 'simple', true);
fn('src/lib/progress.js', 'setEvidence', [88, 94], 'Saves a trimmed evidence URL for a skill quest.', ['utility', 'evidence', 'quest'], 'simple', true);
fn('src/lib/progress.js', 'branchProgress', [96, 104], 'Aggregates completion counts for a role branch.', ['utility', 'progress', 'analytics'], 'simple', true);
fn('src/lib/progress.js', 'recordDay', [109, 114], 'Records activity under a namespaced day key.', ['utility', 'activity', 'progress'], 'simple', true);
fn('src/lib/progress.js', 'weeklyActive', [116, 126], 'Counts distinct active days in the trailing 7-day window.', ['utility', 'activity', 'analytics'], 'simple', true);
fn('src/lib/progress.js', 'bumpStreak', [128, 145], 'Updates the day streak and awards 7-day and 30-day badges.', ['utility', 'streak', 'badges', 'gamification'], 'simple', true);
fn('src/lib/progress.js', 'masteryLevel', [148, 155], 'Computes 0-2 mastery level from completion plus evidence.', ['utility', 'mastery', 'evidence'], 'simple', true);
fn('src/lib/progress.js', 'getStreak', [157, 157], 'Returns the stored streak object.', ['utility', 'streak', 'progress'], 'simple', true);
fn('src/lib/progress.js', 'completedSkillIdsForRole', [162, 180], 'Lists skill ids with verified evidence for a role.', ['utility', 'progress', 'skills', 'verification'], 'simple', true);
fn('src/lib/progress.js', 'clearProgress', [182, 184], 'Resets progress state to empty.', ['utility', 'progress', 'reset'], 'simple', true);
fn('src/lib/streak.js', 'dayISO', [8, 11], 'Formats a timestamp as a YYYY-MM-DD local date.', ['utility', 'date', 'formatting'], 'simple', true);
fn('src/lib/streak.js', 'collectDayDetail', [21, 50], 'Aggregates per-day activity detail with per-kind counts from progress and job events.', ['utility', 'streak', 'activity', 'analytics'], 'moderate', true);
fn('src/lib/streak.js', 'collectDayCounts', [53, 70], 'Aggregates per-day total activity counts.', ['utility', 'activity', 'streak'], 'simple', true);
fn('src/lib/streak.js', 'levelFor', [73, 79], 'Maps a day count to a 0-4 heatmap intensity level.', ['utility', 'heatmap', 'streak'], 'simple', true);
fn('src/lib/streak.js', 'heatmapWeeks', [82, 94], 'Builds week columns of day cells for the heatmap grid.', ['utility', 'heatmap', 'streak'], 'simple', true);
fn('src/lib/streak.js', 'currentStreak', [97, 106], 'Counts consecutive active days ending today or yesterday.', ['utility', 'streak', 'activity'], 'simple', true);
fn('src/lib/streak.js', 'totalActive', [108, 110], 'Counts days with any recorded activity.', ['utility', 'activity', 'analytics'], 'simple', true);
fn('src/lib/xp.js', 'levelFor', [37, 51], 'Maps total XP to a level via ascending thresholds.', ['utility', 'xp', 'level'], 'simple', true);
fn('src/lib/xp.js', 'collectXP', [53, 64], 'Sums weighted XP by source and computes level and total.', ['utility', 'xp', 'level', 'scoring'], 'simple', true);
fn('src/pages/Home.jsx', 'Ring', [37, 53], 'Renders an SVG progress ring for the main score.', ['component', 'score', 'visualization'], 'simple', false);
fn('src/pages/Home.jsx', 'Home', [55, 241], 'Landing dashboard composing score ring, streak and XP meters, gaps, courses, and job matches.', ['page', 'dashboard', 'score', 'jobs'], 'complex', true);
fn('src/pages/Profile.jsx', 'OptionCard', [56, 81], 'Selectable option button used by wizard steps.', ['component', 'onboarding', 'form'], 'simple', false);
fn('src/pages/Profile.jsx', 'ProfileCard', [86, 195], 'Profile summary card with score, streak, XP, skills, and gaps.', ['component', 'profile', 'score', 'gamification'], 'moderate', false);
fn('src/pages/Profile.jsx', 'Profile', [197, 442], 'Multi-step onboarding wizard with auth, account actions, and profile summary.', ['page', 'onboarding', 'profile', 'authentication'], 'complex', true);

// ---- imports edges (1:1 from batchImportData, 42 total) ----
imp('src/components/StreakMeter.jsx', 'src/components/ui.jsx');
imp('src/components/StreakMeter.jsx', 'src/lib/streak.js');
imp('src/components/XpMeter.jsx', 'src/components/ui.jsx');
imp('src/components/XpMeter.jsx', 'src/lib/xp.js');
imp('src/lib/onboarding.js', 'src/lib/storage.js');
imp('src/lib/progress.js', 'src/data/quests.js');
imp('src/lib/progress.js', 'src/lib/quests.js');
imp('src/lib/progress.js', 'src/lib/storage.js');
imp('src/lib/streak.js', 'src/lib/progress.js');
imp('src/lib/streak.js', 'src/lib/storage.js');
imp('src/lib/xp.js', 'src/lib/streak.js');
for (const t of ['src/app/store.jsx','src/ayush/scoring.js','src/components/StreakMeter.jsx','src/components/XpMeter.jsx','src/components/ui.jsx','src/data/courses.js','src/data/jobs.js','src/lib/onboarding.js','src/lib/profile.js','src/lib/progress.js','src/lib/score.js','src/lib/storage.js']) imp('src/pages/Home.jsx', t);
for (const t of ['src/app/store.jsx','src/ayush/scoring.js','src/components/ui.jsx','src/data/ayushSeed.js','src/data/quiz.js','src/data/taxonomy.js','src/lib/auth.js','src/lib/identity.js','src/lib/match.js','src/lib/onboarding.js','src/lib/profile.js','src/lib/progress.js','src/lib/score.js','src/lib/storage.js','src/lib/streak.js','src/lib/xp.js']) imp('src/pages/Profile.jsx', t);
imp('tests/onboarding.test.js', 'src/lib/onboarding.js');
imp('tests/streak.test.js', 'src/lib/streak.js');
imp('tests/xp.test.js', 'src/lib/xp.js');

// ---- calls edges ----
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:collectDayCounts');
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:collectDayDetail');
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:heatmapWeeks');
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:currentStreak');
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:totalActive');
call('src/components/StreakMeter.jsx', 'function:src/lib/streak.js:dayISO');
call('src/components/XpMeter.jsx', 'function:src/lib/xp.js:collectXP');
call('src/lib/streak.js', 'function:src/lib/progress.js:getProgress');
call('src/lib/xp.js', 'function:src/lib/streak.js:collectDayDetail');
call('src/lib/progress.js', 'function:src/lib/quests.js:isEvidenceUrl');
call('src/pages/Home.jsx', 'function:src/lib/progress.js:completedSkillIdsForRole');
call('src/pages/Home.jsx', 'function:src/lib/score.js:calculateMainScore');
call('src/pages/Home.jsx', 'function:src/lib/score.js:questPairsToProof');
call('src/pages/Home.jsx', 'function:src/ayush/scoring.js:vaidyaLevel');
call('src/pages/Home.jsx', 'function:src/lib/onboarding.js:onboardingProgress');
call('src/pages/Home.jsx', 'function:src/data/courses.js:coursesFor');
call('src/pages/Profile.jsx', 'function:src/lib/streak.js:currentStreak');
call('src/pages/Profile.jsx', 'function:src/lib/xp.js:collectXP');
call('src/pages/Profile.jsx', 'function:src/ayush/scoring.js:vaidyaLevel');
call('src/pages/Profile.jsx', 'function:src/lib/score.js:calculateMainScore');
call('src/pages/Profile.jsx', 'function:src/lib/profile.js:loadProfile');
call('src/pages/Profile.jsx', 'function:src/lib/profile.js:saveProfile');
call('src/pages/Profile.jsx', 'function:src/lib/auth.js:getUser');
call('src/pages/Profile.jsx', 'function:src/lib/auth.js:signInWithGoogle');
call('src/pages/Profile.jsx', 'function:src/lib/auth.js:signOut');
call('src/pages/Profile.jsx', 'function:src/lib/onboarding.js:resetOnboarding');

// ---- tested_by edges (production -> test) ----
for (const [p, t] of [['src/lib/onboarding.js','tests/onboarding.test.js'],['src/lib/streak.js','tests/streak.test.js'],['src/lib/xp.js','tests/xp.test.js']])
  E.push({ source: `file:${p}`, target: `file:${t}`, type: 'tested_by', direction: 'forward', weight: 0.5 });

// ---- partition ----
const nodeCount = N.length, edgeCount = E.length;
console.log(`nodes=${nodeCount} edges=${edgeCount}`);
const impCount = E.filter(e => e.type === 'imports').length;
console.log(`imports=${impCount} (expected 42)`);
const byFile = {};
for (const n of N) {
  const fp = n.type === 'file' ? n.filePath : n.filePath;
  (byFile[fp] = byFile[fp] || []).push(n);
}
const files = Object.keys(byFile).sort();
let parts;
if (nodeCount <= 60 && edgeCount <= 120) parts = [files];
else {
  const k = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));
  const size = Math.ceil(files.length / k);
  parts = [];
  for (let i = 0; i < files.length; i += size) parts.push(files.slice(i, i + size));
  console.log(`split into ${parts.length} parts`);
}
const outDir = 'D:\\CodeProjects\\avsar\\avsar SIH 2026\\.ua\\intermediate';
parts.forEach((pf, i) => {
  const ids = new Set();
  pf.forEach(f2 => byFile[f2].forEach(n => ids.add(n.id)));
  const pn = N.filter(n => ids.has(n.id));
  const pe = E.filter(e => ids.has(e.source));
  const name = parts.length === 1 ? 'batch-6.json' : `batch-6-part-${i + 1}.json`;
  fs.writeFileSync(`${outDir}\\${name}`, JSON.stringify({ nodes: pn, edges: pe }, null, 1));
  console.log(`${name}: nodes=${pn.length} edges=${pe.length}`);
});
