const fs = require('fs');
const OUT = 'D:\\CodeProjects\\avsar\\avsar SIH 2026\\.ua\\intermediate';

const batches = JSON.parse(fs.readFileSync('D:\\CodeProjects\\avsar\\avsar SIH 2026\\.ua\\intermediate\\batches.json', 'utf8'));
const b3 = batches.batches.find(x => x.batchIndex === 3);
const known = new Set();
for (const [fp, arr] of Object.entries(b3.batchImportData)) for (const t of arr) known.add(`file:${t}`);
for (const [fp, arr] of Object.entries(b3.neighborMap || {})) for (const n of arr) {
  known.add(`file:${n.path}`);
  for (const s of (n.symbols || [])) { known.add(`function:${n.path}:${s}`); known.add(`class:${n.path}:${s}`); }
}
for (const [p, syms] of Object.entries(batches.exportsByPath || {})) for (const s of syms) { known.add(`function:${p}:${s}`); known.add(`class:${p}:${s}`); }
const F = (path, name, filePath, summary, tags, complexity, extra = {}) =>
  ({ id: `file:${path}`, type: 'file', name, filePath, summary, tags, complexity, ...extra });
const FN = (path, fn, lr, summary, tags, complexity) =>
  ({ id: `function:${path}:${fn}`, type: 'function', name: fn, filePath: path, lineRange: lr, summary, tags, complexity });
const IMP = (s, t) => ({ source: `file:${s}`, target: `file:${t}`, type: 'imports', direction: 'forward', weight: 0.7 });
const CON = (p, fn) => ({ source: `file:${p}`, target: `function:${p}:${fn}`, type: 'contains', direction: 'forward', weight: 1.0 });
const EXP = (p, fn) => ({ source: `file:${p}`, target: `function:${p}:${fn}`, type: 'exports', direction: 'forward', weight: 0.8 });
const CALL = (s, t) => ({ source: s, target: t, type: 'calls', direction: 'forward', weight: 0.8 });
const TESTED = (s, t) => ({ source: `file:${s}`, target: `file:${t}`, type: 'tested_by', direction: 'forward', weight: 0.5 });

const nodes = [
  F('src/app/coach-widget.jsx', 'coach-widget.jsx', 'src/app/coach-widget.jsx',
    'Floating AI career-coach chat widget with quick actions, resume-aware greeting, offline answers plus Groq/Gemini fallback, and a persisted chat log.',
    ['component', 'ai-coach', 'chat-widget', 'resume-aware', 'frontend'], 'complex'),
  FN('src/app/coach-widget.jsx', 'inlineMd', [34, 45], 'Renders **bold** inline markdown segments as strong elements.', ['utility', 'markdown', 'rendering'], 'simple'),
  FN('src/app/coach-widget.jsx', 'ChatText', [47, 87], 'Parses chat text into headings, lists, and paragraphs with inline markdown.', ['utility', 'markdown', 'chat-rendering'], 'moderate'),
  FN('src/app/coach-widget.jsx', 'CoachWidget', [89, 357], 'Floating coach panel: profile-aware context, quick-fix prompts, artifact saving, and AI chat with offline fallback.', ['component', 'ai-coach', 'chat-widget'], 'complex'),

  F('src/data/courses.js', 'courses.js', 'src/data/courses.js',
    'Free course catalog keyed by skill with cert filtering, budget-aware recommendations, YouTube video links, and resume-tip rules.',
    ['data-model', 'courses', 'recommendations', 'resume-tips', 'catalog'], 'moderate'),
  FN('src/data/courses.js', 'coursesFor', [21, 24], 'Returns catalog entries matching a skill name.', ['utility', 'courses', 'lookup'], 'simple'),
  FN('src/data/courses.js', 'certsFor', [27, 31], 'Returns certifiable courses for a skill, falling back to defaults.', ['utility', 'courses', 'certification'], 'simple'),
  FN('src/data/courses.js', 'recommendFor', [38, 53], 'Ranks courses for a skill by cert need, practice preference, and hour budget.', ['utility', 'courses', 'recommendations'], 'moderate'),
  FN('src/data/courses.js', 'videosFor', [57, 59], 'Returns YouTube video courses for a skill.', ['utility', 'courses', 'videos'], 'simple'),
  FN('src/data/courses.js', 'resumeTips', [63, 74], 'Derives resume improvement tips from a score-result breakdown.', ['utility', 'resume-tips', 'scoring'], 'moderate'),

  F('src/data/tuning.js', 'tuning.js', 'src/data/tuning.js',
    'AI tone presets with localStorage-backed tone choice and custom instructions, composing the system preamble for all LLM calls.',
    ['configuration', 'ai-personalization', 'tone-preset', 'local-storage', 'prompting'], 'simple'),
  FN('src/data/tuning.js', 'getTone', [16, 19], 'Returns the saved tone id, falling back to the default.', ['utility', 'tone-preset', 'local-storage'], 'simple'),
  FN('src/data/tuning.js', 'setTone', [21, 23], 'Persists the selected tone id when it is a known preset.', ['utility', 'tone-preset', 'local-storage'], 'simple'),
  FN('src/data/tuning.js', 'getCustom', [25, 27], 'Returns saved custom AI instructions, truncated.', ['utility', 'custom-instructions', 'local-storage'], 'simple'),
  FN('src/data/tuning.js', 'setCustom', [29, 31], 'Persists custom AI instructions, truncated.', ['utility', 'custom-instructions', 'local-storage'], 'simple'),
  FN('src/data/tuning.js', 'systemPreamble', [34, 38], 'Builds the system prompt from the active tone plus custom instructions.', ['utility', 'prompting', 'system-preamble'], 'simple'),

  F('src/lib/ai.js', 'ai.js', 'src/lib/ai.js',
    'Groq/Gemini chat gateway with API-key detection, per-task models, timed fetch, and a localStorage-backed memoization cache.',
    ['service', 'ai-gateway', 'llm-client', 'caching', 'groq-gemini'], 'moderate'),
  FN('src/lib/ai.js', 'modelFor', [23, 25], 'Returns the task-specific model and sampling config.', ['utility', 'model-routing', 'configuration'], 'simple'),
  FN('src/lib/ai.js', 'hasAIKey', [34, 36], 'Reports whether any Groq or Gemini key is configured.', ['utility', 'api-keys', 'feature-flag'], 'simple'),
  FN('src/lib/ai.js', 'postJSON', [38, 56], 'POSTs JSON with an abort timeout and extracts the reply text.', ['utility', 'http-client', 'timeout'], 'moderate'),
  FN('src/lib/ai.js', 'groqChat', [58, 69], 'Sends a prompt to Groq with key rotation and the tuned system preamble.', ['utility', 'groq-client', 'chat'], 'moderate'),
  FN('src/lib/ai.js', 'geminiChat', [71, 80], 'Sends a prompt to Gemini with the tuned system preamble.', ['utility', 'gemini-client', 'chat'], 'moderate'),
  FN('src/lib/ai.js', 'chat', [83, 86], 'Tries Groq then Gemini and returns the first non-empty reply.', ['service', 'chat-fallback', 'llm-client'], 'simple'),
  FN('src/lib/ai.js', 'memoCall', [108, 118], 'Caches async AI results by namespace plus content hash, in memory and storage.', ['utility', 'caching', 'memoization'], 'moderate'),

  F('src/lib/aiQuestions.js', 'aiQuestions.js', 'src/lib/aiQuestions.js',
    'AI-generated quiz, interview, and questionnaire item builders with tolerant parsers that normalize raw LLM JSON output.',
    ['service', 'ai-generation', 'quiz', 'interview', 'parsing'], 'moderate'),
  FN('src/lib/aiQuestions.js', 'parseQuizItems', [13, 31], 'Parses raw LLM output into validated quiz items with options and answers.', ['utility', 'parsing', 'quiz'], 'moderate'),
  FN('src/lib/aiQuestions.js', 'parseInterviewItems', [33, 37], 'Parses raw LLM output into up to 5 interview questions.', ['utility', 'parsing', 'interview'], 'simple'),
  FN('src/lib/aiQuestions.js', 'parseQuestionnaireItems', [39, 62], 'Parses raw LLM output into typed questionnaire items with options.', ['utility', 'parsing', 'questionnaire'], 'moderate'),
  FN('src/lib/aiQuestions.js', 'genQuizItems', [66, 73], 'Generates resume-grounded quiz items via memoized AI chat.', ['service', 'ai-generation', 'quiz'], 'simple'),
  FN('src/lib/aiQuestions.js', 'genInterviewQs', [75, 82], 'Generates resume-grounded interview questions via memoized AI chat.', ['service', 'ai-generation', 'interview'], 'simple'),
  FN('src/lib/aiQuestions.js', 'gradeAnswerAI', [86, 94], 'Grades an interview answer via memoized AI chat with a local fallback grade.', ['service', 'ai-grading', 'interview'], 'simple'),
  FN('src/lib/aiQuestions.js', 'genQuestionnaire', [96, 103], 'Generates a resume-grounded evidence questionnaire via memoized AI chat.', ['service', 'ai-generation', 'questionnaire'], 'simple'),

  F('src/lib/coach.js', 'coach.js', 'src/lib/coach.js',
    'Offline-first career-coach engine: prompt building, match banding, writeups, cover letters, job-posting parsing, and bilingual answers.',
    ['service', 'career-coach', 'matching', 'cover-letter', 'offline-first'], 'complex'),
  FN('src/lib/coach.js', 'ctx', [21, 32], 'Builds the shared coach context from score state and profile.', ['utility', 'context-builder', 'coach'], 'moderate'),
  FN('src/lib/coach.js', 'buildPrompt', [36, 69], 'Builds the LLM prompt for a coach action from score and profile context.', ['utility', 'prompting', 'coach'], 'complex'),
  FN('src/lib/coach.js', 'matchBand', [74, 80], 'Maps a match percentage to a readiness band label.', ['utility', 'matching', 'banding'], 'simple'),
  FN('src/lib/coach.js', 'matchJob', [82, 89], 'Scores a job against found skills into overlap, missing, and band.', ['utility', 'matching', 'job-scoring'], 'simple'),
  FN('src/lib/coach.js', 'matchWriteup', [91, 95], 'Writes the fit summary for a job match.', ['utility', 'matching', 'writeup'], 'simple'),
  FN('src/lib/coach.js', 'reviewWriteup', [97, 102], 'Writes a resume review with score breakdown and course pointers.', ['utility', 'resume-review', 'writeup'], 'simple'),
  FN('src/lib/coach.js', 'coverLetter', [104, 111], 'Drafts a cover letter from profile context and match strengths.', ['utility', 'cover-letter', 'writeup'], 'simple'),
  FN('src/lib/coach.js', 'parseJobPosting', [114, 134], 'Extracts title, company, location, type, and skills from pasted job text.', ['utility', 'job-parsing', 'skill-extraction'], 'moderate'),
  FN('src/lib/coach.js', 'localAnswer', [136, 177], 'Answers any coach action offline, including bilingual AYUSH guidance.', ['service', 'offline-answers', 'coach'], 'complex'),
  FN('src/lib/coach.js', 'askAnswer', [181, 216], 'Answers free-text questions offline via keyword routing over profile context.', ['service', 'offline-answers', 'question-answering'], 'complex'),

  F('src/lib/gemini.js', 'gemini.js', 'src/lib/gemini.js',
    'Tolerant parser that normalizes raw Gemini question-set JSON into {text, dimension} items.',
    ['utility', 'parsing', 'ai-output', 'normalization', 'questionnaire'], 'simple'),
  FN('src/lib/gemini.js', 'parseQuestionSet', [7, 24], 'Strips code fences and parses raw output into question items.', ['utility', 'parsing', 'ai-output'], 'moderate'),

  F('src/lib/parseResume.js', 'parseResume.js', 'src/lib/parseResume.js',
    'Resume ingestion from PDF (pdf.js) or text files with contact extraction and experience/education/skills section bucketing.',
    ['utility', 'resume-parsing', 'pdf-extraction', 'contact-info', 'sectioning'], 'moderate'),
  FN('src/lib/parseResume.js', 'pdfAdapter', [3, 15], 'Extracts text from the first pages of a PDF resume via pdf.js.', ['utility', 'pdf-extraction', 'resume-parsing'], 'moderate'),
  FN('src/lib/parseResume.js', 'parseResumeFile', [21, 29], 'Routes a resume file to the PDF or text adapter by extension.', ['utility', 'resume-parsing', 'file-routing'], 'simple'),
  FN('src/lib/parseResume.js', 'extractContact', [42, 50], 'Extracts email, phone, links, and a likely name from resume text.', ['utility', 'contact-info', 'extraction'], 'simple'),
  FN('src/lib/parseResume.js', 'extractSections', [52, 79], 'Buckets resume lines into contact, experience, education, skills, and certifications.', ['utility', 'sectioning', 'resume-parsing'], 'moderate'),

  F('src/lib/profile.js', 'profile.js', 'src/lib/profile.js',
    'AYUSH student profile persistence in localStorage with markdown rendering and job-scrape query builders.',
    ['service', 'user-profile', 'persistence', 'local-storage', 'job-search'], 'moderate'),
  FN('src/lib/profile.js', 'loadProfile', [17, 19], 'Loads the saved student profile or an empty default.', ['utility', 'user-profile', 'persistence'], 'simple'),
  FN('src/lib/profile.js', 'saveProfile', [21, 25], 'Persists the student profile with an update timestamp.', ['utility', 'user-profile', 'persistence'], 'simple'),
  FN('src/lib/profile.js', 'clearProfile', [27, 29], 'Resets the student profile to empty defaults.', ['utility', 'user-profile', 'persistence'], 'simple'),
  FN('src/lib/profile.js', 'toMarkdown', [33, 52], 'Renders the profile plus scrape queries as markdown for AI context.', ['utility', 'markdown', 'ai-context'], 'moderate'),
  FN('src/lib/profile.js', 'queriesFromProfile', [57, 62], 'Builds deduplicated job-scrape queries from profile skills and goal.', ['utility', 'job-search', 'query-builder'], 'simple'),
  FN('src/lib/profile.js', 'queryFromProfile', [65, 71], 'Returns the single best job-scrape query for a profile.', ['utility', 'job-search', 'query-builder'], 'simple'),

  F('src/pages/Journey.jsx', 'Journey.jsx', 'src/pages/Journey.jsx',
    'Guided onboarding journey page: resume upload and scoring, AI interview practice with grading, tips, courses, and a progress-gated roadmap start.',
    ['page', 'onboarding', 'interview-practice', 'resume-scoring', 'gamification'], 'complex'),
  FN('src/pages/Journey.jsx', 'JourneyBar', [31, 52], 'Renders the staged progress bar for the journey flow.', ['component', 'progress-bar', 'onboarding'], 'moderate'),
  FN('src/pages/Journey.jsx', 'confettiBurst', [55, 93], 'Fires a canvas confetti burst when the journey starts.', ['utility', 'confetti', 'celebration'], 'moderate'),
  FN('src/pages/Journey.jsx', 'Journey', [95, 436], 'Full journey flow across upload, score, tips, courses, and interview tabs.', ['page', 'onboarding', 'interview-practice'], 'complex'),

  F('tests/ai.test.js', 'ai.test.js', 'tests/ai.test.js',
    'Tests for the AI gateway: task model routing and key detection.',
    ['test', 'ai-gateway', 'model-routing', 'unit-test'], 'simple'),
  F('tests/aiquestions.test.js', 'aiquestions.test.js', 'tests/aiquestions.test.js',
    'Tests for AI question parsers covering quiz, interview, and questionnaire shapes.',
    ['test', 'ai-generation', 'parsing', 'unit-test'], 'simple'),
  F('tests/coach.test.js', 'coach.test.js', 'tests/coach.test.js',
    'Tests for the coach engine: matching, writeups, cover letters, and job-posting parsing.',
    ['test', 'career-coach', 'matching', 'unit-test'], 'simple'),
  F('tests/profile.test.js', 'profile.test.js', 'tests/profile.test.js',
    'Tests for profile persistence, markdown rendering, and query builders.',
    ['test', 'user-profile', 'persistence', 'unit-test'], 'simple'),
  F('tests/sections.test.js', 'sections.test.js', 'tests/sections.test.js',
    'Tests for resume contact extraction and section bucketing.',
    ['test', 'resume-parsing', 'sectioning', 'unit-test'], 'simple'),
  F('tests/tips.test.js', 'tips.test.js', 'tests/tips.test.js',
    'Tests for resume-tip derivation from score breakdowns.',
    ['test', 'resume-tips', 'courses', 'unit-test'], 'simple'),
  F('tests/tuning.test.js', 'tuning.test.js', 'tests/tuning.test.js',
    'Tests for AI tone presets and system-preamble composition.',
    ['test', 'tone-preset', 'prompting', 'unit-test'], 'simple'),
];

const edges = [
  // imports — 1:1 from batchImportData (42 total)
  ...['src/app/store.jsx','src/components/ui.jsx','src/data/jobs.js','src/lib/ai.js','src/lib/backend.js','src/lib/coach.js','src/lib/parseResume.js','src/lib/profile.js','src/lib/score.js'].map(t => IMP('src/app/coach-widget.jsx', t)),
  IMP('src/data/tuning.js', 'src/lib/storage.js'),
  ...['src/data/tuning.js','src/lib/quests.js','src/lib/storage.js'].map(t => IMP('src/lib/ai.js', t)),
  ...['src/lib/ai.js','src/lib/gemini.js','src/lib/onboarding.js'].map(t => IMP('src/lib/aiQuestions.js', t)),
  ...['src/data/courses.js','src/lib/store.js'].map(t => IMP('src/lib/coach.js', t)),
  IMP('src/lib/profile.js', 'src/lib/storage.js'),
  ...['src/app/store.jsx','src/ayush/resumes.js','src/components/ui.jsx','src/data/courses.js','src/lib/ai.js','src/lib/aiQuestions.js','src/lib/interview.js','src/lib/onboarding.js','src/lib/parseResume.js','src/lib/profile.js','src/lib/progress.js','src/lib/score.js','src/lib/storage.js'].map(t => IMP('src/pages/Journey.jsx', t)),
  IMP('tests/ai.test.js', 'src/lib/ai.js'),
  IMP('tests/aiquestions.test.js', 'src/lib/aiQuestions.js'),
  ...['src/data/courses.js','src/lib/coach.js'].map(t => IMP('tests/coach.test.js', t)),
  ...['src/data/courses.js','src/lib/profile.js','src/lib/store.js'].map(t => IMP('tests/profile.test.js', t)),
  IMP('tests/sections.test.js', 'src/lib/parseResume.js'),
  IMP('tests/tips.test.js', 'src/data/courses.js'),
  IMP('tests/tuning.test.js', 'src/data/tuning.js'),
  // contains + exports
  ...['inlineMd','ChatText','CoachWidget'].map(f => CON('src/app/coach-widget.jsx', f)),
  EXP('src/app/coach-widget.jsx', 'CoachWidget'),
  ...['coursesFor','certsFor','recommendFor','videosFor','resumeTips'].map(f => CON('src/data/courses.js', f)),
  ...['coursesFor','certsFor','recommendFor','videosFor','resumeTips'].map(f => EXP('src/data/courses.js', f)),
  ...['getTone','setTone','getCustom','setCustom','systemPreamble'].map(f => CON('src/data/tuning.js', f)),
  ...['getTone','setTone','getCustom','setCustom','systemPreamble'].map(f => EXP('src/data/tuning.js', f)),
  ...['modelFor','hasAIKey','postJSON','groqChat','geminiChat','chat','memoCall'].map(f => CON('src/lib/ai.js', f)),
  ...['modelFor','hasAIKey','chat','memoCall'].map(f => EXP('src/lib/ai.js', f)),
  ...['parseQuizItems','parseInterviewItems','parseQuestionnaireItems','genQuizItems','genInterviewQs','gradeAnswerAI','genQuestionnaire'].map(f => CON('src/lib/aiQuestions.js', f)),
  ...['parseQuizItems','parseInterviewItems','parseQuestionnaireItems','genQuizItems','genInterviewQs','gradeAnswerAI','genQuestionnaire'].map(f => EXP('src/lib/aiQuestions.js', f)),
  ...['ctx','buildPrompt','matchBand','matchJob','matchWriteup','reviewWriteup','coverLetter','parseJobPosting','localAnswer','askAnswer'].map(f => CON('src/lib/coach.js', f)),
  ...['buildPrompt','matchBand','matchJob','matchWriteup','reviewWriteup','coverLetter','parseJobPosting','localAnswer'].map(f => EXP('src/lib/coach.js', f)),
  CON('src/lib/gemini.js', 'parseQuestionSet'), EXP('src/lib/gemini.js', 'parseQuestionSet'),
  ...['pdfAdapter','parseResumeFile','extractContact','extractSections'].map(f => CON('src/lib/parseResume.js', f)),
  ...['parseResumeFile','extractContact','extractSections'].map(f => EXP('src/lib/parseResume.js', f)),
  ...['loadProfile','saveProfile','clearProfile','toMarkdown','queriesFromProfile','queryFromProfile'].map(f => CON('src/lib/profile.js', f)),
  ...['loadProfile','saveProfile','clearProfile','toMarkdown','queriesFromProfile','queryFromProfile'].map(f => EXP('src/lib/profile.js', f)),
  ...['JourneyBar','confettiBurst','Journey'].map(f => CON('src/pages/Journey.jsx', f)),
  EXP('src/pages/Journey.jsx', 'Journey'),
  // calls (confident, grounded in callGraph + imports)
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/profile.js:loadProfile'),
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/coach.js:localAnswer'),
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/coach.js:buildPrompt'),
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/ai.js:chat'),
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/ai.js:hasAIKey'),
  CALL('function:src/app/coach-widget.jsx:CoachWidget', 'function:src/lib/parseResume.js:extractContact'),
  CALL('function:src/lib/ai.js:groqChat', 'function:src/data/tuning.js:systemPreamble'),
  CALL('function:src/lib/ai.js:geminiChat', 'function:src/data/tuning.js:systemPreamble'),
  CALL('function:src/lib/ai.js:memoCall', 'function:src/lib/quests.js:hashStr'),
  CALL('function:src/lib/aiQuestions.js:parseInterviewItems', 'function:src/lib/gemini.js:parseQuestionSet'),
  CALL('function:src/lib/aiQuestions.js:genQuizItems', 'function:src/lib/ai.js:memoCall'),
  CALL('function:src/lib/aiQuestions.js:genQuizItems', 'function:src/lib/ai.js:chat'),
  CALL('function:src/lib/aiQuestions.js:genInterviewQs', 'function:src/lib/ai.js:memoCall'),
  CALL('function:src/lib/aiQuestions.js:genInterviewQs', 'function:src/lib/ai.js:chat'),
  CALL('function:src/lib/aiQuestions.js:gradeAnswerAI', 'function:src/lib/ai.js:memoCall'),
  CALL('function:src/lib/aiQuestions.js:gradeAnswerAI', 'function:src/lib/ai.js:chat'),
  CALL('function:src/lib/aiQuestions.js:gradeAnswerAI', 'function:src/lib/onboarding.js:parseAiGrade'),
  CALL('function:src/lib/aiQuestions.js:genQuestionnaire', 'function:src/lib/ai.js:memoCall'),
  CALL('function:src/lib/aiQuestions.js:genQuestionnaire', 'function:src/lib/ai.js:chat'),
  CALL('function:src/lib/coach.js:reviewWriteup', 'function:src/data/courses.js:coursesFor'),
  CALL('function:src/lib/coach.js:localAnswer', 'function:src/data/courses.js:coursesFor'),
  CALL('function:src/lib/coach.js:parseJobPosting', 'function:src/lib/store.js:extractSkills'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/profile.js:loadProfile'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/aiQuestions.js:genInterviewQs'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/aiQuestions.js:gradeAnswerAI'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/parseResume.js:parseResumeFile'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/onboarding.js:onboardingProgress'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/onboarding.js:questionsFromProfile'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/score.js:normalizeScoreResult'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/score.js:scoreResume'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/score.js:calculateMainScore'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/score.js:questPairsToProof'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/data/courses.js:resumeTips'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/data/courses.js:coursesFor'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/interview.js:scoreAnswer'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/progress.js:completedSkillIdsForRole'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/progress.js:recordDay'),
  CALL('function:src/pages/Journey.jsx:Journey', 'function:src/lib/ai.js:hasAIKey'),
  // tested_by (production -> test)
  TESTED('src/lib/ai.js', 'tests/ai.test.js'),
  TESTED('src/lib/aiQuestions.js', 'tests/aiquestions.test.js'),
  TESTED('src/data/courses.js', 'tests/coach.test.js'),
  TESTED('src/lib/coach.js', 'tests/coach.test.js'),
  TESTED('src/data/courses.js', 'tests/profile.test.js'),
  TESTED('src/lib/profile.js', 'tests/profile.test.js'),
  TESTED('src/lib/parseResume.js', 'tests/sections.test.js'),
  TESTED('src/data/tuning.js', 'tests/tuning.test.js'),
  TESTED('src/data/courses.js', 'tests/tips.test.js'),
];

// partition: sort files alphabetically, chunk into 3 parts
const allFiles = [...new Set(nodes.filter(n => n.filePath).map(n => n.filePath))].sort();
const fileSet = p => new Set(allFiles.slice(p[0], p[1]));
const chunks = [[0, 6], [6, 12], [12, 17]];
const nodeIds = new Set(nodes.map(n => n.id));
chunks.forEach(([a, b], i) => {
  const files = new Set(allFiles.slice(a, b));
  const pn = nodes.filter(n => files.has(n.filePath));
  const pids = new Set(pn.map(n => n.id));
  const pe = edges.filter(e => pids.has(e.source));
  // validate targets (Step E: same-part node, any in-batch node,
  // file: ref in batchImportData/neighborMap, or function:/class: symbol in neighbor symbols)
  const allowedFiles = new Set();
  for (const e of pe) {
    if (e.type === 'imports') { allowedFiles.add(e.target.replace(/^file:/, '')); }
  }
  for (const e of pe) {
    if (pids.has(e.target) || nodeIds.has(e.target) || allowedFiles.has(e.target.replace(/^file:/, '')) || known.has(e.target)) continue;
    throw new Error(`part ${i + 1}: dangling target ${e.target} for edge ${e.source}`);
  }
  const frag = { nodes: pn, edges: pe };
  const fp = `${OUT}\\batch-3-part-${i + 1}.json`;
  fs.writeFileSync(fp, JSON.stringify(frag, null, 1));
  console.log(`part ${i + 1}: ${pn.length} nodes, ${pe.length} edges -> ${fp}`);
});
const impCount = edges.filter(e => e.type === 'imports').length;
console.log(`TOTAL nodes=${nodes.length} edges=${edges.length} imports=${impCount}`);
