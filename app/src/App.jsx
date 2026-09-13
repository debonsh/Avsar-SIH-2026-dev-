import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, ArrowUpRight, BellRing, BookOpen, Bookmark, Briefcase,
  CheckCircle2, Circle, CircleCheck, ExternalLink, FileText, Flame, Gauge,
  GraduationCap, Hammer, IdCard, Lock, MapPin, Mic, RotateCcw, Search, ShieldCheck,
  Sparkles, Sprout, Trophy, User, UserRound,
} from "lucide-react";
import { ROLES, scoreResume, rankRoles } from "./lib/score";
import { combineScores } from "./lib/scores";
import { loadQuizBest } from "./data/quiz";
import { matchJobs, JOBS } from "./data/jobs";
import { EXTRA_JOBS } from "./data/seedJobsExtra";
import { NAUKRI_JOBS } from "./data/naukriSeed";
import { loadCustomJobs, listJobsBoard, listLiveJobs, liveCacheAt, mergeJobs, recordApplication } from "./lib/store";
import { coursesFor, recommendFor, PROJECT_IDEAS } from "./data/courses";
import { COLLEGES, recomputeCollegeAvg } from "./data/colleges";
import { loadBoard, submitScore } from "./lib/supabase";
import { INTERVIEW_QS } from "./data/interview";
import { SAMPLE_RESUME } from "./data/fixtures";
import { QUEST_TREE } from "./data/quests";
import { bumpStreak, getStreak, setQuestDone, setEvidence, completedSkillIdsForRole, questSnapshot, recordDay, weeklyActive, masteryLevel } from "./lib/progress";
import { bridgeLine, variableReward } from "./lib/dopamine";
import { track } from "./lib/analytics";
import { isEvidenceUrl } from "./lib/quests";
import { improveResume, mockInterviewFeedback, generateQuestions } from "./lib/gemini";
import { compileEvidence, loadQAnswers, loadCachedSet, saveCachedSet } from "./lib/questionnaire";
import { scoreAnswer, skillReadiness } from "./lib/interview";
import { isVoiceSupported, listenOnce } from "./lib/speech";
import { roadmapGenerator, orderMissingByDemand } from "./lib/roadmapGenerator";
import { parseResumeFile } from "./lib/parseResume";
import { loadJSON, saveJSON } from "./lib/storage";
import Landing from "./components/Landing";
import IndustryPost from "./components/IndustryPost";
import FacultyView from "./components/FacultyView";
import InstituteView from "./components/InstituteView";
import QuizView from "./components/QuizView";
import QuestionnaireView from "./components/QuestionnaireView";
import ProfileView from "./components/ProfileView";
import { loadProfile } from "./lib/profile";
import PortfolioView from "./components/PortfolioView";
import AICoach from "./components/AICoach";
import { loadRole, saveRole } from "./lib/roles";
import { getOrCreateC2CId, loadNickname } from "./lib/identity";
import { Badge, Button, Card, CardHead, Field, MiniMd, Progress, inputCls } from "./components/ui";
import { FadeUp, Lift, Meter, Segmented, Burst, RankUp } from "./components/amicro";

const AI_ON = Boolean(import.meta.env.VITE_GROQ_KEY || import.meta.env.VITE_GEMINI_KEY);

// ponytail: naukri-style save/apply/alert persist in localStorage, no backend until Supabase
const load = (k, fb) => loadJSON(k, fb);
const save = (k, v) => { saveJSON(k, v); };

// ponytail: scoring runs 5× scoreResume + full feed recompute — debounce so keystrokes stay cheap
function useDebouncedValue(v, ms = 200) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

const NAV = [
  ["home", "Home", Sparkles],
  ["you", "You", User],
  ["jobs", "Jobs", Briefcase],
  ["score", "My Score", Gauge],
  ["you", "You", UserRound],
  ["quiz", "Quiz", BookOpen],
  ["quests", "Quests", Sprout],
  ["interview", "Interview", Mic],
  ["battle", "Battle", Trophy],
  ["portfolio", "Portfolio", IdCard],
];

const ROLE_OPTS = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }));
const STEPS = ["Role", "Upload", "Score", "Fix"];
const JOB_TABS = [
  { value: "rec", label: "Recommended" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
];

export default function App() {
  const [appRole, setAppRole] = useState(() => loadRole());
  function changeRole(v) { saveRole(v); setAppRole(v); }
  const [view, setView] = useState(() => {
    // slice F: shared showcase link (?c2c=ID) lands on the portfolio in read-only mode
    try {
      const v = new URLSearchParams(location.search).get("c2c");
      if (v && v !== getOrCreateC2CId()) return "portfolio";
    } catch { /* no browser */ }
    return "home";
  });
  const [q, setQ] = useState("");
  const [locQ, setLocQ] = useState("");
  const [role, setRole] = useState("sde");
  // ponytail: resume persists once locally — upload pain happens one time, never nag re-uploads
  const [text, setText] = useState(() => load("c2c-resume", ""));
  useEffect(() => { if (text.trim().length >= 50) save("c2c-resume", text); }, [text]);
  const [aiTip, setAiTip] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  // interview: rubric base (bank) + AI personal layer (resume customs, cached by hash)
  const [aiQs, setAiQs] = useState({});
  const [aiQsLoading, setAiQsLoading] = useState(false);
  const interviewQs = aiQs[role] || INTERVIEW_QS[role];
  const micros = useMemo(() => interviewQs.map((_, i) => scoreAnswer(answers[i] || "")), [interviewQs, answers]);
  const readiness = useMemo(() => skillReadiness(micros), [micros]);
  async function personalizeInterview() {
    if (aiQsLoading || !text.trim()) return;
    setAiQsLoading(true);
    try {
      const cached = loadCachedSet(text, role, "interview");
      const items = cached || await generateQuestions(text, role, "interview");
      if (items?.length) {
        if (!cached) saveCachedSet(text, role, "interview", items);
        setAiQs((prev) => ({ ...prev, [role]: items.map((q) => q.text) }));
      }
    } finally {
      setAiQsLoading(false);
    }
  }
  const [feedback, setFeedback] = useState("");
  const [myScore, setMyScore] = useState(null);
  // naukri: tracker state
  const [saved, setSaved] = useState(() => load("c2c-saved", []));
  const [applied, setApplied] = useState(() => load("c2c-applied", []));
  const [alert, setAlert] = useState(() => load("c2c-alert", null));
  const [jobTab, setJobTab] = useState("rec");
  const [typeFilter, setTypeFilter] = useState([]);
  const [locFilter, setLocFilter] = useState([]);
  const [eligFilter, setEligFilter] = useState("all");
  const [sort, setSort] = useState("rel");
  // quests/2: quest version + interview streak
  const [questVer, setQuestVer] = useState(0);
  // slice C: quiz best per role feeds MAIN, ver bumps re-read localStorage
  const [quizVer, setQuizVer] = useState(0);
  const [evAsk, setEvAsk] = useState(null); // which skill is being asked for proof link
  const [streak, setStreak] = useState(() => getStreak());
  // celebration + rank-up (eye-candy reward, auto-dismiss)
  const [celebrate, setCelebrate] = useState(null);
  const [rankUp, setRankUp] = useState(null);
  const prevRank = useRef(null);
  // voice: fail tracking + listening indicator for interview slice
  const [voiceFailCount, setVoiceFailCount] = useState(0);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceActiveQ, setVoiceActiveQ] = useState(null);
  const voiceAvailable = useMemo(() => isVoiceSupported(), []);
  // slice1: shared board, seeds until remote loads
  const [board, setBoard] = useState(COLLEGES);
  useEffect(() => { loadBoard().then((b) => { if (b?.length) setBoard(b); }); }, []);
  // slice B: custom (local-first) + remote board jobs merge into the student feed
  const [customJobs, setCustomJobs] = useState(() => loadCustomJobs());
  const [remoteJobs, setRemoteJobs] = useState([]);
  useEffect(() => { listJobsBoard().then((b) => { if (b?.length) setRemoteJobs(b); }); }, []);
  useEffect(() => { setCustomJobs(loadCustomJobs()); }, [view, appRole]);
  // live feed: free API cached 6h, seeds survive offline
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveAt, setLiveAt] = useState(() => liveCacheAt());
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => { listLiveJobs(false, loadProfile()).then((j) => { if (j.length) { setLiveJobs(j); setLiveAt(liveCacheAt()); } }); }, []);
  async function refreshJobs() {
    setRefreshing(true);
    const [b, l] = await Promise.all([listJobsBoard(), listLiveJobs(true, loadProfile())]);
    if (b?.length) setRemoteJobs(b);
    setLiveJobs(l || []);
    setLiveAt(liveCacheAt());
    setCustomJobs(loadCustomJobs());
    setRefreshing(false);
  }

  const earnedSkills = useMemo(() => {
    // recompute when questVer changes so toggling a quest re-credits the score live
    void questVer;
    return completedSkillIdsForRole(role);
  }, [role, questVer]);

  const dtext = useDebouncedValue(text);
  // questionnaire evidence feeds the ATS proof slot — claims with links score
  const [qVer, setQVer] = useState(0);
  const qProof = useMemo(() => { void qVer; return compileEvidence(loadQAnswers(role)); }, [role, qVer]);
  const result = useMemo(
    () => (dtext.trim() ? scoreResume(dtext, role, earnedSkills, { linkedProjects: qProof.linkedProjects }) : null),
    [dtext, role, earnedSkills, qProof]
  );
  const score = result?.total ?? 0;
  // slice C: MAIN gates jobs — ATS + quiz best + verified quest pairs, PRD §4.1 weights
  const quizBest = useMemo(() => { void quizVer; return loadQuizBest(role); }, [role, quizVer]);
  const questPairs = earnedSkills.length;
  const { main: mainScore, rank: mainRank } = useMemo(
    () => combineScores(score, quizBest, questPairs, role),
    [score, quizBest, questPairs, role]
  );
  // bridge-gap framing: showcase-ready, never job-guarantee
  const bridge = result ? bridgeLine(mainScore, result.missing) : null;
  const surprise = useMemo(() => {
    let id = "anon", day = "";
    try { id = getOrCreateC2CId(); day = new Date().toISOString().slice(0, 10); } catch { /* no browser */ }
    return variableReward({ id, day, questPairs, quizBest, main: mainScore, missing: result?.missing || [] });
  }, [questPairs, quizBest, mainScore, result]);
  // rank-up detection: first render arms, later rises pop the modal
  useEffect(() => {
    if (prevRank.current == null) { prevRank.current = mainRank; return; }
    const order = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
    if (order.indexOf(mainRank) > order.indexOf(prevRank.current)) {
      setRankUp(mainRank);
      track("rank_up", { rank: mainRank });
    }
    prevRank.current = mainRank;
  }, [mainRank]);
  // quest-close celebration: earned count rose → eye-candy burst, auto-dismiss
  const earnedRef = useRef(questPairs);
  useEffect(() => {
    if (questPairs > earnedRef.current) {
      setCelebrate(`+verified pair · ${questPairs} showcase-ready`);
      track("quest_closed", { pairs: questPairs });
      const t = setTimeout(() => setCelebrate(null), 2600);
      earnedRef.current = questPairs;
      return () => clearTimeout(t);
    }
    earnedRef.current = questPairs;
  }, [questPairs]);
  // path finder: same resume scored against every role, suggest the best fit
  const bestFit = useMemo(
    () => (dtext.trim().length >= 50 ? rankRoles(dtext, earnedSkills) : null),
    [dtext, earnedSkills]
  );
  const fitSuggest = bestFit && bestFit[0].key !== role ? bestFit[0] : null;
  // roadmap: week-by-week plan from missing skills + checkbox state (after result, TDZ)
  const [roadmapTasks, setRoadmapTasks] = useState(() => load("c2c-roadmap-tasks", {}));
  const jobs = useMemo(() => matchJobs(role, mainScore, result?.found || [], mergeJobs(customJobs, remoteJobs, EXTRA_JOBS, NAUKRI_JOBS, JOBS, liveJobs)), [role, mainScore, result, customJobs, remoteJobs, liveJobs]);
  // roadmap after jobs: weeks ordered by employer demand, not rubric order
  const roadmap = useMemo(() => roadmapGenerator(result?.missing || [], role, jobs), [result, role, jobs]);
  // slice I: opt-in nickname rides next to the college average — resume stays private
  const nick = loadNickname();
  // ponytail: always sorted here — the battle table renders as-is, no second sort
  const byAvg = (rows) => [...rows].sort((a, b) => b.avg - a.avg);
  const colleges = useMemo(() => {
    if (myScore == null) return byAvg(board);
    const youRow = board.find((c) => c.you) || board.find((c) => c.name === "Your College") || board[0];
    return youRow ? recomputeCollegeAvg(board, myScore, youRow.name) : byAvg(board);
  }, [myScore, board]);

  const foundSet = useMemo(() => new Set((result?.found || []).map((s) => s.toLowerCase())), [result]);
  const allTypes = useMemo(() => [...new Set(jobs.map((j) => j.type))], [jobs]);
  const allLocs = useMemo(() => [...new Set(jobs.map((j) => j.loc))], [jobs]);

  // naukri: recommended = eligible-first, then saved/applied shelves, filters, sort
  const visibleJobs = useMemo(() => {
    let list = jobs;
    if (jobTab === "saved") list = list.filter((j) => saved.includes(j.id));
    if (jobTab === "applied") list = list.filter((j) => applied.includes(j.id));
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((j) => `${j.title} ${j.company} ${j.loc} ${j.skills.join(" ")}`.toLowerCase().includes(needle));
    const locNeedle = locQ.trim().toLowerCase();
    if (locNeedle) list = list.filter((j) => j.loc.toLowerCase().includes(locNeedle));
    if (typeFilter.length) list = list.filter((j) => typeFilter.includes(j.type));
    if (locFilter.length) list = list.filter((j) => locFilter.includes(j.loc));
    if (eligFilter === "ok") list = list.filter((j) => j.eligible);
    if (eligFilter === "locked") list = list.filter((j) => !j.eligible);
    if (sort === "easy") list = [...list].sort((a, b) => a.minScore - b.minScore);
    return list;
  }, [jobs, jobTab, saved, applied, q, locQ, typeFilter, locFilter, eligFilter, sort]);

  const eligibleCount = useMemo(() => jobs.filter((j) => j.eligible).length, [jobs]);
  const hasFilters = q || locQ || typeFilter.length || locFilter.length || eligFilter !== "all";
  const filledAnswers = Object.values(answers).filter((a) => (a || "").trim().length > 10).length;
  // naukri: profile completeness from real state, resume, score, interview, saved
  const strength = (text.trim().length >= 50 ? 25 : 0) + (result?.breakdown ? 25 : 0) + (filledAnswers >= 3 ? 25 : 0) + (myScore != null ? 25 : 0);

  function go(v) { setView(v); }
  const toggleIn = (list, set, key, id) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    set(next); save(key, next);
  };
  const toggleList = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  function clearFilters() {
    setQ(""); setLocQ(""); setTypeFilter([]); setLocFilter([]); setEligFilter("all");
  }

  function toggleRoadmapTask(weekIdx, taskIdx) {
    const key = `${weekIdx}-${taskIdx}`;
    setRoadmapTasks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      save("c2c-roadmap-tasks", next);
      return next;
    });
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setText(await parseResumeFile(f));
    } catch (err) {
      alert(err.message);
    }
    e.target.value = ""; // file never leaves browser
  }

  async function getAiHelp() {
    if (!result) return;
    setAiLoading(true);
    const line = result.breakdown.map((b) => `${b.label} ${b.pts}/${b.max}`).join(", ");
    const tip = await improveResume(text, ROLES[role].label, orderMissingByDemand(result.missing, jobs).slice(0, 5), `${score}/95, ${line}`);
    setAiTip(tip || "Add VITE_GROQ_KEY in app/.env to unlock AI rewrites. Local tips above already work for demo.");
    setAiLoading(false);
  }

  async function startVoiceAnswer(qIndex) {
    if (voiceFailCount >= 2 || !voiceAvailable) return; // auto-fallback already active
    setVoiceListening(true);
    setVoiceActiveQ(qIndex);
    const res = await listenOnce(15000);
    setVoiceListening(false);
    setVoiceActiveQ(null);
    if (res.transcript) {
      setAnswers((prev) => ({ ...prev, [qIndex]: res.transcript }));
    } else {
      setVoiceFailCount((c) => c + 1);
    }
  }

  async function gradeInterview() {
    const qs = interviewQs;
    const qa = qs.map((qq, i) => `Q: ${typeof qq === "string" ? qq : qq.text}\nA: ${answers[i] || "(skipped)"}`).join("\n");
    const local = `Local score: ${filledAnswers}/5 answered well. Tip: use STAR (Situation-Task-Action-Result) + 1 number in each answer.`;
    const ai = await mockInterviewFeedback(ROLES[role].label, qa);
    setFeedback(ai || local + " (Add VITE_GROQ_KEY for AI grading.)");
    // quests/2: reward the daily interview habit, even on local mode — gentle, no shame copy
    if (filledAnswers >= 3) {
      const next = bumpStreak("interview");
      setStreak(next);
      track("interview_graded", { filled: filledAnswers });
    }
  }

  function saveScore() {
    if (!score) return;
    setMyScore(score);
    track("score_saved", { score, main: mainScore });
    // slice1: best-effort shared insert, never blocks demo
    const youName = (board.find((c) => c.you) || {}).name || "Your College";
    submitScore(youName, score).then((ok) => { if (ok) loadBoard().then((b) => { if (b?.length) setBoard(b); }); });
    go("battle");
  }

  const statusLine = !result
    ? "Upload a resume to get scored"
    : score >= 70 ? "Job-ready. Apply where eligible." : score >= 45 ? "Close. Fix 2-3 gaps below." : "Foundation stage. 1 project + 1 cert.";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-zinc-950 border-r border-white/10 z-20">
        <button onClick={() => go("jobs")} className="flex items-center gap-2.5 px-5 pt-6 pb-5 text-left cursor-pointer">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-white text-zinc-950">
            <GraduationCap size={18} />
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">Campus2Corporate</span>
            <span className="block text-[11px] text-zinc-500">Academia–Industry Collaboration Portal</span>
          </span>
        </button>
        <nav className="px-3 space-y-1">
          {NAV.map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => go(k)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${view === k ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"}`}
            >
              <Icon size={16} />
              {label}
              {k === "jobs" && result && (
                <Badge tone={view === k ? "light" : eligibleCount ? "emerald" : "zinc"} className="ml-auto">
                  {eligibleCount}
                </Badge>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              Profile strength
              <span className="tabular-nums text-zinc-400">{strength}%</span>
            </div>
            <Progress value={strength} className="mt-2" />
            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
              {strength < 100 ? "Resume, score, interview + save to reach 100." : "All four done."}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold"><ShieldCheck size={14} /> Private by design</div>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">PDFs are parsed in your browser and never uploaded.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-950/85 backdrop-blur border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="lg:hidden grid place-items-center w-8 h-8 rounded-lg bg-white text-zinc-950 shrink-0">
              <GraduationCap size={16} />
            </span>
            <nav className="lg:hidden flex gap-1 overflow-x-auto">
              {NAV.map(([k, label]) => (
                <button key={k} onClick={() => go(k)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${view === k ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/5"}`}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="hidden lg:block text-xs text-zinc-500">
              {view === "home" && "Your verified path to placement"}
              {view === "you" && "5 questions → jobs scraped for you"}
              {view === "jobs" && "Jobs matched to your profile"}
              {view === "score" && "Upload → score → fix gaps"}
              {view === "quiz" && "10 questions, best lifts MAIN"}
              {view === "quests" && "One free course + one project per skill. Finish both to close it."}
              {view === "interview" && "5 questions, graded on STAR + numbers"}
              {view === "battle" && "Averages compete. Resumes stay private."}
              {view === "portfolio" && "Upskilled? Showcase it to the world"}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {result && (
                <Badge tone="emerald" title={bridge || ""}>
                  MAIN {mainScore} · {mainRank}
                </Badge>
              )}
              {streak.count > 0 && (
                <Badge tone="amber" title={`${weeklyActive()} active days this stretch — every day counts, none break it`}>
                  <Flame size={11} /> {weeklyActive()}d active
                </Badge>
              )}
              <Badge tone={AI_ON ? "emerald" : "zinc"}>{AI_ON ? <><Sparkles size={11} /> AI on</> : "Local mode"}</Badge>
              <button onClick={() => go("score")}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors cursor-pointer ${result ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "bg-white text-zinc-950 border-white"}`}>
                {result ? `ATS ${score}` : "Get scored"}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Non-student portals (all three live now) */}
          {appRole === "industry" && <IndustryPost onPosted={() => setCustomJobs(loadCustomJobs())} />}
          {appRole === "faculty" && <FacultyView />}
          {appRole === "institute" && (
            <InstituteView user={{
              role, ats: score, quiz: quizBest, quests: questPairs,
              gaps: (result?.missing || []).slice(0, 3), applied: applied.length > 0,
            }} />
          )}
          {appRole === "student" && view === "home" && <Landing go={go} />}

          {/* You = 5-Q interview → profile.md + personalized scrape */}
          {appRole === "student" && view === "you" && (
            <ProfileView onUseForJobs={() => { refreshJobs(); go("jobs"); track("profile_used", {}); }} />
          )}

          {/* Jobs */}
          {appRole === "student" && view === "jobs" && (
            <div>
              <FadeUp>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Recommended jobs</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                      {result ? `${eligibleCount} eligible at MAIN ${mainScore} (ATS ${score}) · matched to your skills` : "Get scored to see which jobs you can apply to"}
                      {liveAt > 0 && ` · live feed ${Math.max(1, Math.round((Date.now() - liveAt) / 60000))}m ago`}
                    </p>
                    {bridge && (
                      <p className="text-xs mt-1.5 text-zinc-300">
                        <span className="text-emerald-400 font-medium">{bridge}</span>
                        <span className="text-zinc-500"> · we bridge the gap, you earn the offer</span>
                      </p>
                    )}
                    {result && (
                      <p className="text-[11px] mt-1 text-zinc-500">✨ {surprise.title} — {surprise.sub}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (alert) { setAlert(null); save("c2c-alert", null); }
                      else { const a = { q, locQ, types: typeFilter }; setAlert(a); save("c2c-alert", a); }
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer ${alert ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}
                  >
                    <BellRing size={13} /> {alert ? "Alert on" : "Set alert"}
                  </button>
                  <button
                    onClick={refreshJobs}
                    disabled={refreshing}
                    title={liveAt ? "Pull fresh board + live jobs" : "Pull live jobs"}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={13} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "…" : "Refresh"}
                  </button>
                </div>
              </FadeUp>

              {/* naukri: keyword + location search */}
              <FadeUp delay={0.05} className="mt-4">
                <Card className="p-4">
                  <div className="grid sm:grid-cols-[1fr_220px] gap-2">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skills, designation, company…"
                        className={`${inputCls} pl-9`} />
                    </div>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input value={locQ} onChange={(e) => setLocQ(e.target.value)} placeholder="Location…"
                        className={`${inputCls} pl-9`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Segmented options={ROLE_OPTS} value={role} onChange={setRole} />
                  </div>
                </Card>
              </FadeUp>

              {/* naukri: rec / saved / applied shelves */}
              <FadeUp delay={0.08} className="mt-3 flex items-center gap-1 flex-wrap">
                {JOB_TABS.map((t) => {
                  const n = t.value === "saved" ? saved.length : t.value === "applied" ? applied.length : null;
                  return (
                    <button key={t.value} onClick={() => setJobTab(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${jobTab === t.value ? "bg-white text-zinc-950 border-white" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}>
                      {t.label}{n != null && <span className="ml-1.5 tabular-nums opacity-70">{n}</span>}
                    </button>
                  );
                })}
                <div className="ml-auto flex items-center gap-1.5">
                  <label className="text-[11px] text-zinc-500">Sort</label>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 outline-none focus:border-white/40 cursor-pointer">
                    <option value="rel">Relevance</option>
                    <option value="easy">Lowest score first</option>
                  </select>
                </div>
              </FadeUp>

              <div className="grid md:grid-cols-[200px_1fr] gap-4 mt-4 items-start">
                {/* naukri: left filter rail */}
                <FadeUp delay={0.1}>
                  <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Filters</span>
                      {hasFilters && (
                        <button onClick={clearFilters}
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-100 cursor-pointer">
                          <RotateCcw size={11} /> Clear
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Eligibility</div>
                      {[["all", "All"], ["ok", "Eligible"], ["locked", "Locked"]].map(([v, l]) => (
                        <label key={v} className="flex items-center gap-2 text-xs text-zinc-300 py-1 cursor-pointer">
                          <input type="radio" name="elig" checked={eligFilter === v} onChange={() => setEligFilter(v)}
                            className="accent-white" /> {l}
                        </label>
                      ))}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Job type</div>
                      {allTypes.map((t) => (
                        <label key={t} className="flex items-center gap-2 text-xs text-zinc-300 py-1 cursor-pointer">
                          <input type="checkbox" checked={typeFilter.includes(t)} onChange={() => toggleList(typeFilter, setTypeFilter, t)}
                            className="accent-white" /> {t}
                        </label>
                      ))}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Location</div>
                      {allLocs.map((l) => (
                        <label key={l} className="flex items-center gap-2 text-xs text-zinc-300 py-1 cursor-pointer">
                          <input type="checkbox" checked={locFilter.includes(l)} onChange={() => toggleList(locFilter, setLocFilter, l)}
                            className="accent-white" /> {l}
                        </label>
                      ))}
                    </div>
                  </Card>
                </FadeUp>

                {/* results */}
                <div className="space-y-3">
                  {visibleJobs.length === 0 && (
                    <Card className="p-5 text-sm text-zinc-400">
                      {jobTab !== "rec"
                        ? <>{jobTab === "saved" ? "Nothing saved yet — bookmark an eligible role to build your shortlist." : "No applications yet — eligible roles take one click to apply."} <button className="underline font-medium text-zinc-100 cursor-pointer" onClick={() => setJobTab("rec")}>Browse recommended</button></>
                        : <>No matches. <button className="underline font-medium text-zinc-100 cursor-pointer" onClick={clearFilters}>Broaden filters</button> or <button className="underline font-medium text-zinc-100 cursor-pointer" onClick={() => go("score")}>raise MAIN → more unlock</button></>}
                    </Card>
                  )}
                  {visibleJobs.map((j, i) => {
                    const isSaved = saved.includes(j.id);
                    const isApplied = applied.includes(j.id);
                    return (
                      <FadeUp key={j.id} delay={Math.min(i * 0.04, 0.2)}>
                        <article className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-[15px] flex items-center gap-1.5">
                                {!j.eligible && <Lock size={13} className="text-zinc-500" />}
                                {j.title}
                              </div>
                               <div className="text-xs text-zinc-500 mt-0.5">{j.company} • {j.loc} • {j.type} • needs MAIN {j.minScore}+{j.live ? " • live" : j.src ? ` • ${j.src}` : ""}{j.salary ? ` • ${j.salary}` : ""}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge tone={j.eligible ? "emerald" : "amber"}>
                                {j.eligible ? <><CheckCircle2 size={11} /> Eligible</> : `+${j.minScore - score}`}
                              </Badge>
                              <button
                                onClick={() => toggleIn(saved, setSaved, "c2c-saved", j.id)}
                                title={isSaved ? "Remove from saved" : "Save for later"}
                                className={`grid place-items-center w-7 h-7 rounded-lg border transition-colors cursor-pointer ${isSaved ? "border-white bg-white text-zinc-950" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}>
                                <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>
                          {/* skill-match chips from real scoring */}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {j.skills.map((s) => foundSet.has(s.toLowerCase())
                              ? <span key={s} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckCircle2 size={10} />{s}</span>
                              : <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-500">{s}</span>)}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-2 tabular-nums">Matched {j.matched}/{j.skills.length} skills</div>
                          <div className="mt-3 flex items-center gap-2">
                            {isApplied
                              ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400"><CheckCircle2 size={13} /> Applied
                                  <button onClick={() => toggleIn(applied, setApplied, "c2c-applied", j.id)} className="underline text-zinc-500 hover:text-zinc-300 cursor-pointer">undo</button></span>
                              : j.eligible
                                ? <Lift>
                                    <a href={j.apply} target="_blank" rel="noreferrer"
                                      onClick={() => { if (!applied.includes(j.id)) { const n = [...applied, j.id]; setApplied(n); save("c2c-applied", n); recordApplication(j, score, mainScore); track("job_applied", { id: j.id }); } }}
                                      className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200">
                                      Apply <ArrowUpRight size={13} />
                                    </a>
                                  </Lift>
                                : <button onClick={() => go("score")}
                                    className="text-xs font-medium text-amber-400 hover:underline cursor-pointer">Need {j.minScore - mainScore} more pts. Check My Score</button>}
                          </div>
                        </article>
                      </FadeUp>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Score */}
          {appRole === "student" && view === "score" && (
            <div className="max-w-2xl mx-auto">
              <FadeUp>
                <h1 className="text-2xl font-bold tracking-tight">My Score</h1>
                <p className="text-sm text-zinc-500 mt-1">Transparent rubric. Every point shows its evidence.</p>
              </FadeUp>
              <FadeUp delay={0.05}>
                <ol className="flex items-center gap-1.5 mt-4 mb-4">
                  {STEPS.map((s, i) => {
                    const done = (i === 0) || (i === 1 && text.trim()) || (i === 2 && result) || (i === 3 && result?.missing?.length);
                    return (
                      <li key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
                        <span className={`grid place-items-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${done ? "bg-white text-zinc-950" : "border border-white/15 text-zinc-500"}`}>{i + 1}</span>
                        <span className={`text-xs font-medium ${done ? "text-zinc-100" : "text-zinc-500"}`}>{s}</span>
                        {i < 3 && <span className="flex-1 h-px bg-white/10 mx-1" />}
                      </li>
                    );
                  })}
                </ol>
              </FadeUp>

              <div className="space-y-4">
                <FadeUp delay={0.08}>
                  <Card>
                    <CardHead title="Step 1: Target role" desc="Pick one, or paste your resume and take the suggestion" />
                    <div className="p-4 space-y-2.5">
                      <Segmented options={ROLE_OPTS} value={role} onChange={setRole} />
                      {fitSuggest && (
                        <button onClick={() => setRole(fitSuggest.key)}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer">
                          Your resume scores highest as {fitSuggest.label} ({fitSuggest.total}). Switch to it
                        </button>
                      )}
                    </div>
                  </Card>
                </FadeUp>

                <FadeUp delay={0.12}>
                  <Card>
                    <CardHead title="Step 2: Upload resume" desc="Parsed locally, never uploaded" />
                    <div className="p-4 space-y-3">
                      <Field label="Resume file (PDF or TXT)">
                        <input type="file" accept=".pdf,.txt" onChange={onFile}
                          className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:bg-white file:text-zinc-950 file:border-0 file:text-xs file:font-medium file:cursor-pointer hover:file:bg-zinc-200 text-zinc-500 cursor-pointer" />
                      </Field>
                      <Field label="Or paste resume text">
                        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste resume text here…"
                          className={`${inputCls} h-36 resize-y`} />
                      </Field>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setText(SAMPLE_RESUME)}>Try sample</Button>
                        <Lift><Button variant="success" size="sm" onClick={saveScore} disabled={!result}>Save score → battle <ArrowRight size={13} /></Button></Lift>
                      </div>
                    </div>
                  </Card>
                </FadeUp>

                <FadeUp delay={0.16}>
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6 text-center">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Step 3: ATS Score • {ROLES[role].label}</div>
                      <div className="text-6xl font-extrabold tracking-tight my-2 tabular-nums">{result ? score : "––"}</div>
                      <div className="text-xs text-zinc-400">{result ? statusLine : "Upload to score"}</div>
                      {result && (
                        <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                          MAIN {mainScore} • {mainRank} (ATS {score} + Quiz {quizBest} + {questPairs} quest{questPairs === 1 ? "" : "s"})
                        </div>
                      )}
                      {bridge && (
                        <p className="text-xs mt-2 text-zinc-300"><span className="text-emerald-400 font-medium">{bridge}</span></p>
                      )}
                      {result && (
                        <p className="text-[11px] mt-1 text-zinc-500">Next best move: {quizBest === 0 ? "take the quiz (30% of MAIN, ~5 min)" : result.missing.length ? `close ${result.missing[0]} — 1 quest pair, then re-check MAIN` : "share your portfolio — you are showcase-ready"} · ✨ {surprise.title}: {surprise.sub}</p>
                      )}
                      {result && quizBest === 0 && (
                        <button onClick={() => go("quiz")}
                          className="mt-2 text-xs font-medium text-emerald-400 hover:underline cursor-pointer">
                          Take the quiz → lift MAIN and unlock jobs
                        </button>
                      )}
                      {result?.breakdown && (
                        <div className="text-left mt-5 space-y-2.5">
                          {result.breakdown.map((b) => (
                            <div key={b.label}>
                              <div className="flex justify-between text-xs"><span className="text-zinc-400">{b.label}</span><span className="font-semibold tabular-nums">{b.pts}/{b.max}</span></div>
                              <div className="mt-1"><Meter value={b.pts} max={b.max} /></div>
                              {(b.why || []).map((w, i) => (
                                <p key={i} className="text-[11px] text-zinc-500 mt-0.5 leading-snug">· {w}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {result?.msg && <p className="text-xs text-amber-400 mt-3">{result.msg}</p>}
                    </div>
                </FadeUp>

                {result && result.breakdown && (
                  <FadeUp delay={0.2}>
                    <Card>
                      <CardHead title="Step 4: Fix gaps (free)" desc="Top 3 missing skills + one project" />
                      <div className="p-4 space-y-3">
                        {orderMissingByDemand(result.missing, jobs).slice(0, 3).map((m) => (
                          <div key={m} className="rounded-lg bg-white/[0.03] border border-white/10 p-3">
                            <div className="text-sm font-semibold capitalize">Missing: {m}</div>
                            {coursesFor(m).length > 0 && <div className="text-[11px] text-zinc-600">Picked for your goal{loadProfile()?.goal ? ` (${loadProfile().goal})` : ""} — You tab retunes this</div>}
                            {recommendFor(m, loadProfile() || {}).map((c) => (
                              <a key={c.u + c.t} href={c.u} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white hover:underline mt-1"><BookOpen size={12} /> {c.t}</a>
                            ))}
                          </div>
                        ))}
                        <div className="flex items-start gap-1.5 text-xs text-zinc-400"><Hammer size={13} className="mt-0.5 shrink-0" /> Do 1 project: {PROJECT_IDEAS[role][0]}</div>
                        <Button className="w-full" onClick={getAiHelp} disabled={aiLoading}>
                          <Sparkles size={14} /> {aiLoading ? "AI thinking…" : "AI rewrite my bullets (needs key)"}
                        </Button>
                        {aiTip && <div className="text-xs p-3 bg-white/[0.03] rounded-lg border border-white/10 leading-relaxed text-zinc-300"><MiniMd text={aiTip} /></div>}
                      </div>
                    </Card>
                  </FadeUp>
                )}
              </div>
            </div>
          )}

          {/* You: questionnaire answers become ATS evidence */}
          {appRole === "student" && view === "you" && (
            <QuestionnaireView key={role} role={role} resumeText={text} onSaved={() => setQVer((v) => v + 1)} />
          )}

          {/* Quiz = the word "questionnaire" (Slice C) */}
          {appRole === "student" && view === "quiz" && (
            <QuizView role={role} roleOpts={ROLE_OPTS} onRoleChange={setRole} onDone={() => setQuizVer((v) => v + 1)} />
          )}

          {/* Quests: skill-tree gamification */}
          {appRole === "student" && view === "quests" && (() => {
            const tree = QUEST_TREE[role];
            const roleSkills = ROLES[role].skills.map((s) => s.toLowerCase());
            // ponytail: snapshot once — per-skill helpers would re-parse the blob each
            const snap = questSnapshot();
            const snapC = (id) => Boolean(snap.quests[`${role}:${id}:course`]);
            const snapP = (id) => Boolean(snap.quests[`${role}:${id}:project`]);
            const snapE = (id) => snap.evidence[`${role}:${id}`] || "";
            let earnedCount = 0, totalCount = 0;
            const branchData = tree.branches.map((br) => {
              const done = br.skills.filter((sk) => snapC(sk.id) && snapP(sk.id)).length;
              earnedCount += done;
              totalCount += br.skills.length;
              return { ...br, done };
            });
            return (
              <div className="max-w-2xl mx-auto">
                <FadeUp>
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Skill quests</h1>
                      <p className="text-sm text-zinc-500 mt-1">
                        Each skill needs a <span className="text-zinc-300">free course</span> + a <span className="text-zinc-300">real project with proof link</span>. Verified pairs lift your ATS.
                      </p>
                    </div>
                    <Badge tone="emerald">{earnedCount}/{totalCount} skills closed</Badge>
                  </div>
                </FadeUp>
                <FadeUp delay={0.05} className="mt-4">
                  <div className="mb-3"><Segmented options={ROLE_OPTS} value={role} onChange={setRole} /></div>
                </FadeUp>
                <FadeUp delay={0.08}>
                  <Card className="p-4">
                    <Progress value={earnedCount} max={totalCount || 1} />
                    <p className="text-[11px] text-zinc-500 mt-2">
                        Closing a quest adds the skill to your score even if it's not yet on your resume. Target gaps <span className="text-zinc-300">first</span>. They unblock eligibility fastest.
                    </p>
                  </Card>
                </FadeUp>
                <div className="space-y-3 mt-4">
                  {branchData.map((br, bi) => (
                    <FadeUp key={br.id} delay={Math.min(0.05 + bi * 0.05, 0.3)}>
                      <Card>
                        <CardHead
                          title={br.name}
                          desc={`${br.done}/${br.skills.length} complete`}
                          right={br.done === br.skills.length && <Badge tone="emerald">Branch done</Badge>}
                        />
                        <div className="p-4 space-y-3">
                          {br.skills.map((sk) => {
                            const cDone = snapC(sk.id);
                            const pDone = snapP(sk.id);
                            const complete = cDone && pDone && isEvidenceUrl(snapE(sk.id));
                            const closesGap = roleSkills.includes(sk.name.toLowerCase());
                            return (
                              <div key={sk.id}
                                className={`rounded-lg border p-3 transition-colors ${complete
                                  ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                                  : "border-white/10 bg-white/[0.02]"}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-semibold flex items-center gap-2">
                                      {complete
                                        ? <CircleCheck size={15} className="text-emerald-400" />
                                        : <Circle size={15} className="text-zinc-500" />}
                                      {sk.name}
                                      {closesGap && !complete && <Badge tone="amber">Closes resume gap</Badge>}
                                      <span className="ml-1 tabular-nums text-[10px] text-zinc-500" title={`Mastery L${masteryLevel(role, sk.id, quizBest)}/3`}>
                                        {"●".repeat(masteryLevel(role, sk.id, quizBest))}{"○".repeat(3 - masteryLevel(role, sk.id, quizBest))}
                                      </span>
                                    </div>
                                  </div>
                                  {complete && <Badge tone="emerald">+score</Badge>}
                                </div>
                                {/* course row */}
                                <div className="mt-2.5 flex items-start gap-2 text-xs text-zinc-300">
                                  <button
                                    onClick={() => { setQuestDone(role, sk.id, "course", !cDone); setQuestVer((v) => v + 1); }}
                                    className={`grid place-items-center w-6 h-6 rounded-md border shrink-0 mt-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${cDone ? "bg-emerald-400 border-emerald-400 text-zinc-950" : "border-white/20 hover:border-white/40"}`}
                                    title={cDone ? "Mark course undone" : "Mark course done"}>
                                    {cDone && <CircleCheck size={12} />}
                                  </button>
                                  <div className="flex-1">
                                    <div className="font-medium">Course</div>
                                    <a href={sk.course.u} target="_blank" rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-100">
                                      <BookOpen size={11} /> {sk.course.t} <ExternalLink size={10} />
                                    </a>
                                  </div>
                                </div>
                                {/* project row: proof link gates the tick — no evidence, no score lift */}
                                <div className="mt-2 flex items-start gap-2 text-xs text-zinc-300">
                                  <button
                                    onClick={() => {
                                      if (!pDone && !isEvidenceUrl(snapE(sk.id))) { setEvAsk(`${role}:${sk.id}`); return; }
                                      setQuestDone(role, sk.id, "project", !pDone); setQuestVer((v) => v + 1);
                                    }}
                                    className={`grid place-items-center w-6 h-6 rounded-md border shrink-0 mt-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${pDone ? "bg-emerald-400 border-emerald-400 text-zinc-950" : "border-white/20 hover:border-white/40"}`}
                                    title={pDone ? "Mark project undone" : "Mark project done"}>
                                    {pDone && <CircleCheck size={12} />}
                                  </button>
                                  <div className="flex-1">
                                    <div className="font-medium">Project</div>
                                    <div className="text-zinc-400">{sk.project}</div>
                                      {(evAsk === `${role}:${sk.id}` || snapE(sk.id)) && (
                                        <input
                                          key={`${role}:${sk.id}:${questVer}`}
                                          defaultValue={snapE(sk.id)}
                                        onBlur={(e) => { setEvidence(role, sk.id, e.target.value); setEvAsk(null); setQuestVer((v) => v + 1); }}
                                        placeholder="Proof link: GitHub repo / live URL…"
                                        className="mt-1.5 w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 outline-none placeholder:text-zinc-600 focus:border-white/40"
                                      />
                                    )}
                                      {!pDone && evAsk === `${role}:${sk.id}` && !isEvidenceUrl(snapE(sk.id)) && (
                                      <p className="text-[11px] text-amber-400 mt-1">Paste your repo or live link first — ticks without proof don't lift your score.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </FadeUp>
                    ))}
                </div>
                {/* roadmap: week-by-week plan from missing skills */}
                {roadmap.length > 0 && (
                  <FadeUp delay={0.25}>
                    <Card>
                      <CardHead title="Your roadmap" desc={`${result.missing.length} missing skills · ${roadmap.length} week plan · ${Object.values(roadmapTasks).filter(Boolean).length} tasks done`} />
                      <div className="p-4 space-y-3">
                        {roadmap.map((wk, wi) => (
                          <div key={wk.week} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                            <div className="text-xs font-semibold text-zinc-400 mb-2">Week {wk.week}</div>
                            {wk.tasks.map((t, ti) => {
                              const done = roadmapTasks[`${wi}-${ti}`];
                              return (
                                <div key={ti} className="flex items-start gap-2 text-xs text-zinc-300 mt-1.5">
                                  <button
                                    onClick={() => toggleRoadmapTask(wi, ti)}
                                    className={`grid place-items-center w-5 h-5 rounded-md border shrink-0 mt-0.5 ${done ? "bg-emerald-400 border-emerald-400 text-zinc-950" : "border-white/20 hover:border-white/40"}`}
                                    title={done ? "Mark undone" : "Mark done"}>
                                    {done && <CircleCheck size={12} />}
                                  </button>
                                  <div className="flex-1">
                                    <span className={done ? "line-through text-zinc-500" : ""}>{t.text}</span>
                                    {t.link && (
                                      <a href={t.link.u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-100 ml-1">
                                        <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </FadeUp>
                )}
              </div>
            );
          })()}

          {/* Interview */}
          {appRole === "student" && view === "interview" && (
            <div className="max-w-2xl mx-auto">
              <FadeUp>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mock interview</h1>
                    <p className="text-sm text-zinc-500 mt-1">5 questions for {ROLES[role].label} · 60-second demo. <button className="underline font-medium text-zinc-100 cursor-pointer" onClick={() => go("score")}>Change role</button></p>
                  </div>
                  <div className="flex items-center gap-2">
                    {streak.count > 0 && (
                      <Badge tone="amber" title="Graded 3+ answers today counts as your daily streak">
                        <Flame size={11} /> {streak.count}-day streak
                      </Badge>
                    )}
                    {streak.badges.includes("interview-ready") && <Badge tone="emerald">Interview Ready</Badge>}
                    {streak.badges.includes("sharp") && <Badge tone="emerald">Sharp 10</Badge>}
                  </div>
                </div>
              </FadeUp>
              <FadeUp delay={0.06} className="mt-4">
                <Card>
                  <CardHead title={`Questions • ${ROLES[role].label}`} desc={`Answered well: ${filledAnswers}/5 · graded on STAR + numbers`} />
                  <div className="p-4 space-y-3">
                    <p className="text-[11px] text-zinc-500 leading-relaxed">Rubric preview — each answer wants: <span className="text-zinc-300">STAR shape · 1 number · role keyword · ≤3 sentences · no hedge words</span>.</p>
                    <p className="text-[11px] text-zinc-500 tabular-nums">Skill readiness — Scene {Math.round(readiness.s * 100)}% · Task {Math.round(readiness.t * 100)}% · Action {Math.round(readiness.a * 100)}% · Result {Math.round(readiness.r * 100)}% · avg {readiness.avg}/4</p>
                    {voiceFailCount >= 2 && (
                      <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        Voice unavailable. Type instead.
                      </p>
                    )}
                    {interviewQs.map((qq, i) => (
                      <Field key={i} label={`Q${i + 1}. ${qq}`}>
                        <div className="flex gap-2">
                          <input value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                            placeholder="Your answer…" className={inputCls} />
                          {voiceAvailable && voiceFailCount < 2 && (
                            <button
                              onClick={() => startVoiceAnswer(i)}
                              disabled={voiceListening}
                              className={`shrink-0 grid place-items-center w-11 h-11 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${voiceListening && voiceActiveQ === i ? "bg-red-500/20 border-red-500/40 text-red-400" : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"}`}
                              title={voiceListening && voiceActiveQ === i ? "Listening… (15s)" : "Speak answer"}>
                              <Mic size={16} className={voiceListening && voiceActiveQ === i ? "animate-pulse" : ""} />
                            </button>
                          )}
                        </div>
                        {(answers[i] || "").trim() && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                            {["s", "t", "a", "r"].map((k) => (
                              <span key={k} title={{ s: "Scene", t: "Task", a: "Action", r: "Result" }[k]}
                                className={`px-1.5 py-0.5 rounded font-semibold uppercase ${micros[i].stars[k] ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-600"}`}>{k}</span>
                            ))}
                            <span className="text-zinc-400 tabular-nums ml-1">{micros[i].micro}/4</span>
                            {micros[i].tips[0] && <span className="text-zinc-500">· {micros[i].tips[0]}</span>}
                          </div>
                        )}
                      </Field>
                    ))}
                    <div className="flex gap-2">
                      <Lift><Button className="flex-1" onClick={gradeInterview}><Mic size={14} /> Grade me</Button></Lift>
                      <Button variant="secondary" onClick={personalizeInterview} disabled={aiQsLoading || !text.trim()} title={text.trim() ? "Generate questions from your resume (needs key)" : "Paste your resume on the Score tab first"}>
                        <Sparkles size={14} /> {aiQsLoading ? "Writing…" : aiQs[role] ? "Regenerate" : "Make it mine"}
                      </Button>
                    </div>
                    {!(import.meta.env?.VITE_GROQ_KEY || import.meta.env?.VITE_GEMINI_KEY) && (
                      <p className="text-[11px] text-zinc-600">Personal questions need VITE_GROQ_KEY — bank questions work offline.</p>
                    )}
                    {streak.lastDay && (
                      <p className="text-[11px] text-zinc-500 -mt-1">
                        {weeklyActive("interview")} active days and counting — miss a day, nothing breaks, the count keeps your history.
                      </p>
                    )}
                    {feedback && <div className="text-xs p-3 bg-white/[0.03] rounded-lg border border-white/10 leading-relaxed text-zinc-300"><MiniMd text={feedback} /></div>}
                  </div>
                </Card>
              </FadeUp>
            </div>
          )}

          {/* Battle */}
          {appRole === "student" && view === "battle" && (
            <div className="max-w-2xl mx-auto">
              <FadeUp>
                <h1 className="text-2xl font-bold tracking-tight">College Battle</h1>
                <p className="text-sm text-zinc-500 mt-1">Demo averages + your live score. Resumes stay private. Only numbers compete.</p>
                {myScore != null && colleges.length >= 2 && (
                  <p className="text-xs mt-1.5 text-zinc-400">
                    ⚔️ Squad-lite: your college vs <span className="text-zinc-100 font-medium">{colleges[0].you ? colleges[1]?.name : colleges[0]?.name}</span> — top avg {colleges[0].you ? colleges[1]?.avg : colleges[0]?.avg}. Full multiplayer seasons next.
                  </p>
                )}
              </FadeUp>
              <FadeUp delay={0.06} className="mt-4">
                <Card>
                  <CardHead title="Leaderboard" desc="Average ATS by college" right={myScore != null && <Badge tone="emerald">Your score: {myScore}</Badge>} />
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/[0.07]">
                        <th className="font-medium px-5 py-2.5">#</th>
                        <th className="font-medium py-2.5">College</th>
                        <th className="font-medium py-2.5 hidden sm:table-cell">Members</th>
                        <th className="font-medium px-5 py-2.5 text-right">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colleges.map((c, i) => (
                        <tr key={c.name} className={`border-b border-white/5 last:border-0 ${c.you ? "bg-white/[0.04]" : ""}`}>
                          <td className="px-5 py-3 text-zinc-500 font-medium tabular-nums">{i + 1}</td>
                          <td className="py-3 pr-3">
                            <div className="font-medium flex items-center gap-1.5">{c.you && <Badge tone="light">{nick || "You"}</Badge>}{c.name}</div>
                            <div className="mt-1.5 w-40 max-w-full"><Progress value={c.avg} /></div>
                          </td>
                          <td className="py-3 text-zinc-500 hidden sm:table-cell tabular-nums">{c.members}</td>
                          <td className="px-5 py-3 text-right font-bold tabular-nums">{c.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!myScore && (
                    <div className="p-4 border-t border-white/[0.07]">
                      <Button variant="secondary" size="sm" onClick={() => go("score")}><FileText size={13} /> Get scored to join the battle</Button>
                    </div>
                  )}
                </Card>
              </FadeUp>
            </div>
          )}

          {/* Portfolio = showcase in a cool way (Slice F) */}
          {appRole === "student" && view === "portfolio" && (
            <PortfolioView
              role={role} result={result} main={mainScore} rank={mainRank}
              quizBest={quizBest} questPairs={questPairs} questVer={questVer} earnedSkills={earnedSkills}
              appliedCount={applied.length} go={go}
            />
          )}
          {celebrate && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
              <Burst className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={14} /> {celebrate}
              </Burst>
            </div>
          )}
          {rankUp && <RankUp rank={rankUp} onClose={() => setRankUp(null)} onShowcase={() => { setRankUp(null); go("portfolio"); }} />}
        </main>

        <footer className="max-w-5xl mx-auto px-4 pb-8 pt-2 text-center text-[11px] text-zinc-600">
          <span className="inline-flex items-center gap-1.5"><Briefcase size={11} /> Inspired by naukri.com workflows</span>
          {" · "}Local ATS works offline • Add VITE_GROQ_KEY for AI • PDFs never leave your browser
          {/* ponytail: portals hidden, student-first login. Demo access stays via subtle footer link */}
          {appRole === "student" ? (
            <div className="mt-2 text-zinc-700">
              For partners:{" "}
              <button className="underline hover:text-zinc-400 cursor-pointer" onClick={() => changeRole("industry")}>recruiters</button>
              {" · "}
              <button className="underline hover:text-zinc-400 cursor-pointer" onClick={() => changeRole("faculty")}>faculty</button>
              {" · "}
              <button className="underline hover:text-zinc-400 cursor-pointer" onClick={() => changeRole("institute")}>institutes</button>
            </div>
          ) : (
            <div className="mt-2">
              <button className="underline hover:text-zinc-400 cursor-pointer" onClick={() => changeRole("student")}>← back to student login</button>
            </div>
          )}
        </footer>

        {/* Slice H: floating coach on every student view, grounded in live state */}
        {appRole === "student" && (
          <AICoach
            roleLabel={ROLES[role].label}
            score={score}
            missing={result ? orderMissingByDemand(result.missing, jobs).slice(0, 5) : []}
            found={result?.found || []}
            bestFitLabel={bestFit?.[0]?.label}
            resumeText={text}
          />
        )}
      </div>
    </div>
  );
}
