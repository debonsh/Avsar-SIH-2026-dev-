// ponytail: 6 shadcn-style primitives cover the whole app — add more only when a view needs one
export function Button({ variant = "primary", size = "md", className = "", ...rest }) {
  const v = {
    primary: "bg-white text-zinc-950 hover:bg-zinc-200",
    secondary: "bg-white/5 text-zinc-100 border border-white/10 hover:bg-white/10",
    outline: "border border-white/15 text-zinc-300 hover:bg-white/5",
    ghost: "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
    success: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
  }[variant];
  const s = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
  }[size];
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${v} ${s} ${className}`}
      {...rest}
    />
  );
}

export function Card({ className = "", ...rest }) {
  return <section className={`bg-white/[0.03] border border-white/10 rounded-xl ${className}`} {...rest} />;
}

export function CardHead({ title, desc, right }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/[0.07]">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {desc && <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({ tone = "zinc", className = "", ...rest }) {
  const t = {
    zinc: "bg-white/5 text-zinc-300 border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    light: "bg-white text-zinc-950 border-white",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${t} ${className}`} {...rest} />
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-300 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-zinc-500 mt-1.5">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 outline-none text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/10 transition";

export function Progress({ value, max = 100, className = "" }) {
  return (
    <div className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}
