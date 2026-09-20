// Avsar shell: header nav, routes, footer. Every nav item is a real route.
import { useEffect, useRef } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router";
import Home from "../pages/Home.jsx";
import Resume from "../pages/Resume.jsx";
import Jobs from "../pages/Jobs.jsx";
import Quests from "../pages/Quests.jsx";
import Quiz from "../pages/Quiz.jsx";
import Interview from "../pages/Interview.jsx";
import Institute from "../pages/Institute.jsx";
import Faculty from "../pages/Faculty.jsx";
import Portfolio from "../pages/Portfolio.jsx";
import Profile from "../pages/Profile.jsx";
import NotFound from "../pages/NotFound.jsx";
import Industry from "../pages/Industry.jsx";
import Verify from "../pages/Verify.jsx";
import { CoachWidget } from "./coach-widget.jsx";
import { RouteErrorBoundary } from "./error-boundary.jsx";

const PRIMARY = [
  { to: "/resume", label: "resume" },
  { to: "/jobs", label: "jobs" },
  { to: "/quests", label: "quests" },
];

const MORE = [
  { to: "/quiz", label: "quiz" },
  { to: "/interview", label: "interview" },
  { to: "/portfolio", label: "portfolio" },
  { to: "/institute", label: "institute" },
  { to: "/industry", label: "industry" },
  { to: "/faculty", label: "faculty" },
  { to: "/profile", label: "profile" },
];

function linkCls({ isActive }) {
  return `inline-flex min-h-[40px] items-center rounded-none px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
  }`;
}

export function Shell() {
  const moreRef = useRef(null);
  const { pathname } = useLocation();

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
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-zinc-300">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-zinc-950 focus:p-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
          <NavLink to="/" className="mr-3 inline-flex items-center gap-2 text-base font-semibold text-zinc-50">
            <span className="flex size-7 items-center justify-center rounded-none bg-blurple font-display text-sm font-bold text-white">
              A
            </span>
            avsar
          </NavLink>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
            {PRIMARY.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
            <details ref={moreRef} className="relative">
              <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center rounded-none px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
                more
              </summary>
              <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                {MORE.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className="block rounded-none px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </details>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <RouteErrorBoundary path={pathname}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/institute" element={<Institute />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/industry" element={<Industry />} />
          <Route path="/verify/:code" element={<Verify />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteErrorBoundary>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
          <div>
            <p className="text-sm font-semibold text-zinc-100">avsar</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
              score your resume, close skill gaps, track applications. works offline, syncs to supabase
              when configured.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[["/resume", "resume"], ["/jobs", "jobs"], ["/quests", "quests"], ["/quiz", "quiz"], ["/interview", "interview"]].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} className="text-zinc-400 hover:text-zinc-100">{label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">Resources</p>
            <ul className="mt-3 space-y-2 text-sm">
              { [["/portfolio", "portfolio"], ["/institute", "institute"], ["/industry", "industry"], ["/faculty", "faculty"], ["/profile", "profile"]].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} className="text-zinc-400 hover:text-zinc-100">{label}</NavLink>
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
