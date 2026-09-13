// Shared primitives: one card, one button scale, one meter, one donut.
// Reason (R-31): a single visual language keeps every route feeling like one
// product instead of twelve prototypes. No icons, no decoration.
import { Link } from "react-router";

export function Page({ title, sub, actions, children }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function H2({ children }) {
  return <h2 className="mb-3 text-sm font-semibold text-zinc-900">{children}</h2>;
}

// Single accent usage: primary buttons only (R-29, one deliberate accent).
export function Btn({ to, variant = "primary", className = "", ...rest }) {
  const base =
    "inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const tones = {
    primary: "bg-green-700 text-white hover:bg-green-800",
    quiet: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100",
    dangerQuiet: "border border-zinc-300 bg-white text-red-700 hover:bg-red-50",
  };
  const cls = `${base} ${tones[variant] || tones.primary} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest} />;
  return <button type="button" className={cls} {...rest} />;
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-400";

export function Meter({ value, max }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-100" role="img" aria-label={`${value} of ${max}`}>
      <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

const DONUT_COLORS = ["#16a34a", "#2563eb", "#d97706", "#db2777", "#7c3aed", "#a1a1aa"];

// Zero-dependency donut. Each chart carries its question in the title (no
// "Overview" charts): pass label like "Where your pipeline stands".
export function Donut({ segs = [], size = 120, thick = 16, label = "Distribution" }) {
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f4f4f5" strokeWidth={thick} />
      {segs.map((s, i) => (
        <circle
          key={s.label}
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={s.label === "none" ? "transparent" : DONUT_COLORS[i % DONUT_COLORS.length]}
          strokeWidth={thick}
          strokeDasharray={`${Math.max(0, s.fraction * c - 1.5)} ${c}`}
          strokeDashoffset={-s.start * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
    </svg>
  );
}

export const DONUT_COLORS_EXPORT = DONUT_COLORS;

export function Chip({ children, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-green-50 text-green-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-800",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.zinc}`}>
      {children}
    </span>
  );
}

// Empty states name the cause and the one action that fills them (R-27).
export function Empty({ title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <p className="font-semibold">Something failed to load</p>
      <p className="mt-1">{message}</p>
      {onRetry && (
        <Btn variant="quiet" className="mt-3" onClick={onRetry}>
          Try again
        </Btn>
      )}
    </div>
  );
}
