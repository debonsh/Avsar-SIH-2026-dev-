// Shell: header nav, routes, footer. Every nav item is a real route (R-24).
import { NavLink, Route, Routes } from "react-router";
import Home from "../pages/Home.jsx";
import Resume from "../pages/Resume.jsx";
import Jobs from "../pages/Jobs.jsx";
import Quests from "../pages/Quests.jsx";
import Coach from "../pages/Coach.jsx";
import Quiz from "../pages/Quiz.jsx";
import Interview from "../pages/Interview.jsx";
import Institute from "../pages/Institute.jsx";
import Faculty from "../pages/Faculty.jsx";
import Portfolio from "../pages/Portfolio.jsx";
import Profile from "../pages/Profile.jsx";
import NotFound from "../pages/NotFound.jsx";

const PRIMARY = [
  { to: "/resume", label: "Resume" },
  { to: "/jobs", label: "Jobs" },
  { to: "/quests", label: "Quests" },
  { to: "/coach", label: "Coach" },
];

const MORE = [
  { to: "/quiz", label: "Quiz" },
  { to: "/interview", label: "Interview" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/institute", label: "Institute" },
  { to: "/faculty", label: "Faculty" },
  { to: "/profile", label: "Profile" },
];

function linkCls({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium min-h-[40px] inline-flex items-center ${
    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
}

export function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
          <NavLink to="/" className="mr-3 text-base font-semibold tracking-tight text-zinc-900">
            Campus2Corporate
          </NavLink>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
            {PRIMARY.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
            <details className="relative">
              <summary className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 min-h-[40px] inline-flex items-center list-none">
                More
              </summary>
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
                {MORE.map((l) => (
                  <NavLink key={l.to} to={l.to} className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </details>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/institute" element={<Institute />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 text-sm text-zinc-500 sm:px-6">
          Campus2Corporate: score your resume, close skill gaps, track applications. Works offline, syncs to Supabase when configured.
        </div>
      </footer>
    </div>
  );
}
