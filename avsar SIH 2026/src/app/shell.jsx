// Avsar shell: header nav, routes, footer. Every nav item is a real route.
// Single-track BAMS portal: role is always ayush, rendered in the light ayurveda theme.
// Nav DNA: CoreUI navbar (brand left, nav cluster center, stat+avatar right) on
// desktop; Duolingo-style icon bottom tabs on mobile. One segmented control,
// one sliding pill, no hamburger.
import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router";
import CIcon from "@coreui/icons-react";
import {
  cilSpa, cilHome, cilCompass, cilBriefcase, cilBook, cilUser, cilChevronBottom,
  cilSun, cilMoon,
} from "@coreui/icons";
import { motion, useReducedMotion } from "motion/react";
import { useC2C } from "./store.jsx";
import { calculateMainScore } from "../lib/score.js";
import { loadTheme, saveTheme } from "../lib/theme.js";
import { loadLang, saveLang, t } from "../lib/i18n.js";
import { getUser, signInWithGoogle, signOut, onAuthChange } from "../lib/auth.js";
import Jobs from "../pages/Jobs.jsx";
import Quests from "../pages/Quests.jsx";
import Quiz from "../pages/Quiz.jsx";
import Interview from "../pages/Interview.jsx";
import Institute from "../pages/Institute.jsx";
import Faculty from "../pages/Faculty.jsx";
import Portfolio from "../pages/Portfolio.jsx";
import Profile from "../pages/Profile.jsx";
import Journey from "../pages/Journey.jsx";
import Home from "../pages/Home.jsx";
import NotFound from "../pages/NotFound.jsx";
import Industry from "../pages/Industry.jsx";
import Verify from "../pages/Verify.jsx";
import Ayush from "../pages/Ayush.jsx";
import Resume from "../pages/Resume.jsx";
import Match from "../pages/Match.jsx";
import Programs from "../pages/Programs.jsx";
import Workspace from "../pages/Workspace.jsx";
import Public from "../pages/Public.jsx";
import { CoachWidget } from "./coach-widget.jsx";
import { RouteErrorBoundary } from "./error-boundary.jsx";

// Desktop segmented control: the four places a student lives.
const SEGMENTS = [
  { to: "/home", label: "Home", icon: cilHome },
  { to: "/journey", label: "Journey", icon: cilCompass },
  { to: "/jobs", label: "Internships", icon: cilBriefcase },
  { to: "/quests", label: "Quests", icon: cilBook },
];

// Mobile bottom tabs: same four plus the profile.
const TABS = [...SEGMENTS, { to: "/profile", label: "Profile", icon: cilUser }];

const MORE = [
  { to: "/resume", label: "Resume score" },
  { to: "/quiz", label: "Quiz" },
  { to: "/interview", label: "Interview prep" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/institute", label: "Institute" },
  { to: "/industry", label: "For hospitals" },
  { to: "/faculty", label: "Faculty" },
  { to: "/ayush", label: "Ayush home" },
  { to: "/match", label: "How we match" },
  { to: "/programs", label: "Programs" },
  { to: "/workspace", label: "Workspace" },
];

// i18n keys parallel the routes so the toggle below stays a pure map.
const NAV_KEY = { "/home": "nav.home", "/journey": "nav.journey", "/jobs": "nav.internships", "/quests": "nav.quests", "/profile": "nav.profile" };
const MORE_KEY = {
  "/resume": "more.resume", "/quiz": "more.quiz", "/interview": "more.interview",
  "/portfolio": "more.portfolio", "/institute": "more.institute", "/industry": "more.industry",
  "/faculty": "more.faculty", "/ayush": "more.ayush", "/match": "more.match",
  "/programs": "more.programs", "/workspace": "more.workspace",
};

// Readiness ring: the one number a student checks daily, always one tap from scoring.
// Reason it is a ring, not a pill: progress reads at a glance and costs less header width.
function ReadinessRing({ value, lang }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const frac = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <NavLink
      to="/resume"
      title={value === null ? t(lang, "readiness.score") : `Readiness ${value} of 100`}
      aria-label={value === null ? t(lang, "readiness.score") : `Readiness ${value} of 100. Open resume score.`}
      className="group inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white py-1 pl-1 pr-3 hover:border-emerald-500"
    >
      <span className="relative flex size-8 items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden className="-rotate-90">
          <circle cx="12" cy="12" r={r} fill="none" stroke="#e7e0cd" strokeWidth="3" />
          <circle
            cx="12" cy="12" r={r} fill="none" stroke="#1e7a4c" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(frac * c).toFixed(1)} ${c.toFixed(1)}`}
          />
        </svg>
        <span className="absolute text-[10px] font-bold tabular-nums text-emerald-900">
          {value === null ? "–" : value}
        </span>
      </span>
      <span className="hidden text-xs font-semibold text-emerald-900 min-[400px]:inline">
        {value === null ? t(lang, "readiness.score") : t(lang, "readiness.ready")}
      </span>
    </NavLink>
  );
}

function Brand() {
  return (
    <NavLink to="/" className="mr-1 inline-flex shrink-0 items-center gap-2" aria-label="Avsar home">
      <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-700 text-white">
        <CIcon icon={cilSpa} width={18} height={18} />
      </span>
      <span className="text-base font-bold tracking-tight text-emerald-950">Avsar</span>
      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
        SIH&rsquo;26
      </span>
    </NavLink>
  );
}

export function Shell() {
  const moreRef = useRef(null);
  const { pathname } = useLocation();
  const { role, resume, funnel } = useC2C();
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState(() => loadTheme());
  const [lang, setLang] = useState(() => loadLang());
  const [user, setUser] = useState(null);
  const readiness = resume?.result ? calculateMainScore(resume.result.total, 0, 0, role) : null;
  const activeCount = (funnel.saved || 0) + (funnel.applied || 0);
  const flipLang = () => {
    const next = lang === "hi" ? "en" : "hi";
    saveLang(next);
    setLang(next);
  };
  const segs = SEGMENTS.map((s) => ({ ...s, label: t(lang, NAV_KEY[s.to]) || s.label }));
  const tabs = TABS.map((s) => ({ ...s, label: t(lang, NAV_KEY[s.to]) || s.label }));
  const moreLinks = MORE.map((l) => ({ ...l, label: t(lang, MORE_KEY[l.to]) || l.label }));

  useEffect(() => {
    saveTheme(theme);
    document.body.style.background = theme === "dark" ? "#0d100e" : "#f6f3ea";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0d100e" : "#f6f3ea");
  }, [theme]);

  useEffect(() => {
    getUser().then(setUser).catch(() => {});
    onAuthChange(setUser);
  }, []);

  // The More menu is uncontrolled; close it imperatively on navigation,
  // outside click, and Escape so it never lingers.
  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = () => {
      if (moreRef.current?.open) moreRef.current.open = false;
    };
    const onDown = (e) => {
      if (moreRef.current?.open && !moreRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Static active pill: layoutId springs measure layout on every nav
  // change, which janks on weak GPUs. A plain fill reads the same.
  const pill = (active) =>
    active ? <span className="absolute inset-0 rounded-full bg-emerald-700" /> : null;

  return (
    <div className={`${theme === "dark" ? "ayush-dark" : "ayush-light"} flex min-h-dvh flex-col bg-ink text-zinc-300`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-zinc-950 focus:p-2"
      >
        {t(lang, "nav.skip")}
      </a>
      <header className="app-header sticky top-0 z-30 border-b border-emerald-900/10 bg-[#f6f3ea]/90">
        <div className="h-0.5 bg-gradient-to-r from-emerald-800 via-emerald-500 to-amber-400" aria-hidden />
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2 sm:px-6">
          <Brand />
          <nav aria-label="Primary" className="mx-auto hidden items-center gap-0.5 rounded-full border border-emerald-900/10 bg-white p-1 shadow-sm sm:flex">
            {segs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    isActive ? "text-white" : "text-stone-500 hover:text-emerald-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {pill(isActive)}
                    <span className="relative flex items-center gap-1.5">
                      <CIcon icon={t.icon} width={15} height={15} aria-hidden />
                      {t.label}
                      {t.to === "/jobs" && activeCount > 0 && (
                        <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold tabular-nums text-emerald-950">
                          {activeCount}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <button
              type="button"
              onClick={flipLang}
              aria-label={t(lang, "lang.switch")}
              title={t(lang, "lang.switch")}
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-stone-200 bg-white px-2 font-mono text-xs font-bold text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-800"
            >
              {lang === "hi" ? "EN" : "हि"}
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? t(lang, "theme.toLight") : t(lang, "theme.toDark")}
              title={theme === "dark" ? t(lang, "theme.toLight") : t(lang, "theme.toDark")}
              className="flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-800"
            >
              <CIcon icon={theme === "dark" ? cilSun : cilMoon} width={17} height={17} />
            </button>
            <details ref={moreRef} className="relative hidden sm:block">
              <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-stone-500 hover:bg-emerald-50 hover:text-emerald-900">
                {t(lang, "nav.more")} <CIcon icon={cilChevronBottom} width={13} height={13} aria-hidden />
              </summary>
              <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                <div className="border-b border-stone-100 px-3 py-2.5">
                  {user ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-stone-600">{user.email}</p>
                      <button
                        type="button"
                        onClick={() => signOut().then(() => setUser(null))}
                        className="shrink-0 text-xs font-semibold text-emerald-700 underline underline-offset-4"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const { error } = await signInWithGoogle();
                        if (error) alert(error);
                      }}
                      className="text-xs font-semibold text-emerald-700 underline underline-offset-4"
                    >
                      Continue with Google
                    </button>
                  )}
                </div>
                {moreLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className="block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-emerald-50"
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </details>
            <ReadinessRing value={readiness} lang={lang} />
            <NavLink
              to="/profile"
              aria-label={user ? `Profile, signed in as ${user.email}` : "Open profile"}
              className={({ isActive }) =>
                `relative flex size-10 items-center justify-center rounded-full border transition-colors ${
                  isActive
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-stone-200 bg-white text-stone-500 hover:border-emerald-400 hover:text-emerald-800"
                }`
              }
            >
              {user ? (
                <span className="text-sm font-bold uppercase" aria-hidden>
                  {(user.email || "V")[0]}
                </span>
              ) : (
                <CIcon icon={cilUser} width={18} height={18} />
              )}
              {user && (
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#f6f3ea] bg-emerald-500" aria-hidden />
              )}
            </NavLink>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 pb-24 sm:pb-0">
        <RouteErrorBoundary path={pathname}>
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
          <Routes>
          <Route path="/" element={<Ayush />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/institute" element={<Institute />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/home" element={<Home />} />
          <Route path="/industry" element={<Industry />} />
          <Route path="/verify/:code" element={<Verify />} />
          <Route path="/ayush" element={<Ayush />} />
          <Route path="/match" element={<Match />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:jobId" element={<Workspace />} />
          <Route path="/u/:id" element={<Public />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </motion.div>
        </RouteErrorBoundary>
      </main>

      <footer className="border-t border-emerald-900/10">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
              <CIcon icon={cilSpa} width={15} height={15} aria-hidden /> Avsar
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">
              {t(lang, "footer.tag")}
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{t(lang, "footer.upskill")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[["/resume", "Resume score"], ["/quests", "Quests"], ["/quiz", "Quiz"], ["/interview", "Interview prep"]].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} className="text-stone-500 hover:text-emerald-800">{label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{t(lang, "footer.career")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              { [["/jobs", "Internships & jobs"], ["/portfolio", "Portfolio"], ["/institute", "Institute"], ["/industry", "For hospitals"], ["/profile", "Profile"]].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} className="text-stone-500 hover:text-emerald-800">{label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>

      {/* mobile bottom tabs */}
      <nav aria-label="Mobile" className="app-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-emerald-900/10 bg-[#f6f3ea]/95 pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5 px-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors ${
                  isActive ? "text-emerald-800" : "text-stone-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-1/2 top-0 h-1 w-8 -translate-x-1/2 rounded-b-full bg-emerald-600" />
                  )}
                  <span className="relative">
                    <CIcon icon={t.icon} width={21} height={21} aria-hidden />
                    {t.to === "/jobs" && activeCount > 0 && (
                      <span className="absolute -right-2 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold tabular-nums text-white">
                        {activeCount}
                      </span>
                    )}
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <CoachWidget />
    </div>
  );
}
