// Avsar shell: header nav, routes, footer. Every nav item is a real route.
// Single-track BAMS portal: role is always ayush, rendered in the light ayurveda theme.
import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router";
import { Leaf, Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useC2C } from "./store.jsx";
import { calculateMainScore } from "../lib/score.js";
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
import { CoachWidget } from "./coach-widget.jsx";
import { RouteErrorBoundary } from "./error-boundary.jsx";

const PRIMARY = [
  { to: "/resume", label: "Resume" },
  { to: "/jobs", label: "Internships" },
  { to: "/quests", label: "Quests" },
];

const MORE = [
  { to: "/home", label: "Home" },
  { to: "/quiz", label: "Quiz" },
  { to: "/interview", label: "Interview" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/institute", label: "Institute" },
  { to: "/industry", label: "Industry" },
  { to: "/faculty", label: "Faculty" },
  { to: "/profile", label: "Profile" },
  { to: "/ayush", label: "Ayush home" },
];

function linkCls({ isActive }) {
  return `inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-emerald-700 text-white" : "text-stone-500 hover:bg-emerald-50 hover:text-emerald-900"
  }`;
}

// Readiness ring: the one number a student checks daily, always one tap from scoring.
// Reason it is a ring, not a pill: progress reads at a glance and costs less header width.
function ReadinessRing({ value }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const frac = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <NavLink
      to="/resume"
      title={value === null ? "Score your resume to set readiness" : `Readiness ${value} of 100`}
      aria-label={value === null ? "Score your resume" : `Readiness ${value} of 100. Open resume score.`}
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
      <span className="text-xs font-semibold text-emerald-900">
        {value === null ? "Score resume" : "Ready"}
      </span>
    </NavLink>
  );
}

export function Shell() {
  const moreRef = useRef(null);
  const { pathname } = useLocation();
  const { role, resume, funnel } = useC2C();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const readiness = resume?.result ? calculateMainScore(resume.result.total, 0, 0, role) : null;
  const activeCount = (funnel.saved || 0) + (funnel.applied || 0);

  // The More menu is uncontrolled; close it imperatively on navigation,
  // outside click, and Escape so it never lingers.
  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
    setMenuOpen(false);
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
  return (
    <div className="ayush-light flex min-h-dvh flex-col bg-ink text-zinc-300">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-zinc-950 focus:p-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#f6f3ea]/90 backdrop-blur">
        <div className="h-0.5 bg-emerald-700" aria-hidden />
        <div className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-1.5 sm:px-6">
          <NavLink to="/" className="mr-2 inline-flex items-center gap-2 text-base font-semibold text-emerald-950">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Leaf className="size-4" aria-hidden />
            </span>
            Avsar
          </NavLink>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {PRIMARY.map((l) => (
              <NavLink key={l.to} to={l.to} className={l.to === "/jobs" ? undefined : linkCls}>
                {l.to === "/jobs" ? (
                  <span className={({ isActive }) => linkCls({ isActive }) + " relative"}>
                    {l.label}
                  </span>
                ) : (
                  l.label
                )}
              </NavLink>
            ))}
            <details ref={moreRef} className="relative">
              <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center rounded-full px-3 py-2 text-sm font-medium text-stone-500 hover:bg-emerald-50 hover:text-emerald-900">
                More
              </summary>
              <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                {MORE.map((l) => (
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
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ReadinessRing value={readiness} />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:border-emerald-400 sm:hidden"
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav aria-label="Mobile" className="border-t border-emerald-900/10 bg-[#f6f3ea] px-4 py-2 sm:hidden">
            {[...PRIMARY, ...MORE].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-emerald-700 text-white" : "text-stone-600"}`
                }
              >
                {l.label}
                {l.to === "/jobs" && activeCount > 0 && (
                  <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold tabular-nums text-white">
                    {activeCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <RouteErrorBoundary path={pathname}>
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
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
          <Route path="*" element={<NotFound />} />
          </Routes>
          </motion.div>
        </RouteErrorBoundary>
      </main>

      <footer className="border-t border-emerald-900/10">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
          <div>
            <p className="text-sm font-semibold text-emerald-950">Avsar</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">
              Score your BAMS resume, clear the SHISHIKSHA checklist, and apply to
              ayurveda internships through one tracked pipeline.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Upskill</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[["/resume", "Resume score"], ["/quests", "Quests"], ["/quiz", "Quiz"], ["/interview", "Interview prep"]].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} className="text-stone-500 hover:text-emerald-800">{label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Career</p>
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
      <CoachWidget />
    </div>
  );
}
