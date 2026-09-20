// [ayush] shared chrome for the ayush portal: govt masthead (tricolor rule,
// emblem block, bilingual title), notice ticker, subnav. tech portal untouched.
import { Link, NavLink } from "react-router";
import { AYUSH_NOTICES } from "./data.js";
import { AYUSH_FEED_NOTICES, AYUSH_FEED_AT } from "./feed.js";
import { AYUSH_NEWS } from "./news.js";

const TICKER = [...AYUSH_FEED_NOTICES, ...AYUSH_NOTICES, ...AYUSH_NEWS];

function subCls({ isActive }) {
  return `border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest ${
    isActive
      ? "border-blurple bg-blurple/15 text-blurple-soft"
      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
  }`;
}

export default function Masthead() {
  return (
    <div>
      <div className="h-1 bg-gradient-to-r from-orange-500 via-zinc-100 to-green-600" aria-hidden />
      <div className="border-b border-zinc-800 bg-panel">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center bg-blurple font-mono text-lg text-white" aria-hidden>
            आ
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium text-zinc-100">ayushsetu</p>
            <p className="font-mono text-[11px] text-zinc-500">आयुष सेतु · bams to vaidya · ncism aligned</p>
          </div>
          <span className="hidden border border-sage/40 bg-sage/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-sage sm:inline">
            ministry of ayush · sih26044
          </span>
          <Link
            to="/tech"
            className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-100"
          >
            tech portal →
          </Link>
        </div>
        <div className="border-t border-zinc-800">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6">
            <NavLink to="/ayush" end className={subCls}>portal</NavLink>
            <NavLink to="/ayush/roles" className={subCls}>roles</NavLink>
            <NavLink to="/ayush/colleges" className={subCls}>colleges</NavLink>
            <NavLink to="/ayush/assess" className={subCls}>ai assessment</NavLink>
            <NavLink to="/ayush/admin" className={subCls}>admin</NavLink>
          </div>
        </div>
      </div>
      <div className="overflow-hidden border-b border-zinc-800 bg-zinc-950" aria-label="Notices">
        <div className="ticker flex w-max gap-8 whitespace-nowrap px-4 py-1.5 font-mono text-[11px] text-zinc-500">
          {[...TICKER, ...TICKER].map((n, i) => (
            <a key={`${n.id}-${i}`} href={n.url} target="_blank" rel="noreferrer" className="hover:text-zinc-200">
              <span className="text-blurple-soft">[{n.tag}]</span> {n.text}
            </a>
          ))}
        </div>
        <p className="border-t border-zinc-800 px-4 py-1 font-mono text-[10px] text-zinc-700 sm:px-6">
          notices refresh: npm run ayush:feed · last {AYUSH_FEED_AT}
        </p>
      </div>
    </div>
  );
}
