// Avsar UI primitives. Dark zinc panels, blurple reserved for action and
// progress; mono type only for measurement (scores, counts, urls).
// Dials: ENERGY 2 / RHYTHM 2 / MOTION 1. Palette: zinc neutrals plus blurple;
// green, amber, red, and blue read as status only, never decoration.
// Type roles: Archivo display, Inter body, system mono for measurement only.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { animate, motion, useReducedMotion } from "motion/react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Page({ title, sub, actions, children }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            {title && (
              <h1 className="text-balance font-display text-2xl font-bold tracking-[-0.02em] text-zinc-50 sm:text-3xl">
                {title}
              </h1>
            )}
            {sub && <p className="mt-2 text-pretty text-sm leading-6 text-zinc-400">{sub}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Card is the default work panel. Dark fits the dense queue screens; light
// exists for the stone-ink callers (Public, Programs non-tech). The theme is
// set where the ink lives, so contrast holds on both.
export function Card({ tone = "dark", className = "", children, ...rest }) {
  return (
    <section
      className={cn(
        "rounded-xl border p-5",
        tone === "light" ? "border-stone-200 bg-white" : "border-zinc-800 bg-zinc-950",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

// H2 follows its Card: zinc ink on dark panels, stone ink on light ones.
// A heading is only as readable as the panel behind it.
export function H2({ tone = "dark", children, className = "" }) {
  return (
    <h2 className={cn("mb-3 text-sm font-semibold", tone === "light" ? "text-stone-900" : "text-zinc-100", className)}>
      {children}
    </h2>
  );
}

// Radius: lg on controls so they read apart from xl panels. Base height 44px
// meets the tap target; sm stays small for dense rows only. One blurple
// focus ring on every variant because keyboard users tab these daily.
const buttonVariants = cva(
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-[scale,background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blurple active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-blurple text-white hover:bg-blurple-deep",
        quiet:
          "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
        dangerQuiet: "border border-zinc-800 text-red-400 hover:bg-red-950",
        ghost: "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100",
      },
      size: {
        sm: "h-8 min-h-0 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6",
        icon: "size-11 min-h-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

// shadcn Button: asChild renders a Radix Slot (e.g. <Button asChild><Link/>).
export function Button({ to, asChild, variant, size, className, ...rest }) {
  const cls = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot className={cls} {...rest} />;
  if (to) return <Link to={to} className={cls} {...rest} />;
  return <button type="button" className={cls} {...rest} />;
}

// Btn stays because 20+ screens already import it; same voice as Button.
export const Btn = Button;

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium leading-none text-zinc-200">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-zinc-500">{hint}</span>}
    </label>
  );
}

// Inputs sit on dark panels, so the ring and border answer in blurple.
export const inputCls =
  "flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-700 focus:border-blurple focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blurple";

export function Meter({ value, max }) {
  const reduce = useReducedMotion();
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div
      className="h-2 overflow-hidden rounded-xl bg-zinc-800"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} of ${max}`}
    >
      <motion.div
        className="h-full w-full origin-left rounded-xl bg-blurple"
        initial={reduce ? { scaleX: frac } : { scaleX: 0 }}
        whileInView={{ scaleX: frac }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

// Series tokens shared with Radar: emerald marks the held value, amber the
// target, zinc fills the rest. One token set so charts never invent a palette.
const SERIES = {
  emerald: "#1e7a4c",
  emeraldDeep: "#166038",
  amber: "#c77b21",
  tan: "#d6cfae",
  zincSoft: "#a1a1aa",
  zincMute: "#78716c",
};

const DONUT_COLORS = [SERIES.emerald, SERIES.tan, SERIES.amber, SERIES.emeraldDeep, SERIES.zincSoft, SERIES.zincMute];

// Zero-dependency donut, segments fade in with a stagger.
export function Donut({ segs = [], size = 120, thick = 16, label = "Distribution" }) {
  const reduce = useReducedMotion();
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={thick} />
      {segs.map((s, i) => (
        <motion.circle
          key={s.label}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={s.label === "none" ? "transparent" : DONUT_COLORS[i % DONUT_COLORS.length]}
          strokeWidth={thick}
          strokeDasharray={`${Math.max(0, s.fraction * c - 1.5)} ${c}`}
          strokeDashoffset={-s.start * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.08 }}
        />
      ))}
    </svg>
  );
}

// Legacy alias: Jobs.jsx already imports this name for its legend dots.
export const DONUT_COLORS_EXPORT = DONUT_COLORS;

// Zero-dependency radar: skill profile (emerald, filled) vs target role
// (amber, dashed). axes: [{ label, value, target }] on a shared 0–max scale.
// Grid uses currentColor at low opacity so the panel theme shows through.
export function Radar({ axes = [], max = 5, size = 280, className = "h-auto w-full", label = "Skill radar" }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = axes.length;
  if (!n) return null;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (Math.max(0, Math.min(max, v)) / max) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const poly = (key) => axes.map((a, i) => pt(i, a[key]).join(",")).join(" ");
  const rings = [1, 2, 3, 4, 5].filter((x) => x <= max);
  // Long axis names ("Pharmacovigilance") would cross the polygons and the
  // frame edge, so labels truncate while <title> keeps the full name for AT.
  const short = (s) => {
    const t = String(s || "");
    return t.length > 12 ? `${t.slice(0, 11)}…` : t;
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className={className}>
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => pt(i, (ring / max) * max).join(",")).join(" ")}
          fill="none" stroke="currentColor" strokeOpacity={ring === max ? 0.35 : 0.14} strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.14" />;
      })}
      <polygon points={poly("target")} fill={SERIES.amber} fillOpacity="0.08" stroke={SERIES.amber} strokeWidth="1.5" strokeDasharray="5 3" />
      <polygon points={poly("value")} fill={SERIES.emerald} fillOpacity="0.22" stroke={SERIES.emerald} strokeWidth="2" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, max * 1.16);
        return (
          <g key={a.label}>
            <title>{`${a.label}: ${a.value} of ${max}, target ${a.target}`}</title>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="currentColor" fillOpacity="0.75">
              {short(a.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Badges are status tags with counts, never decoration: full radius sets them
// apart from lg controls and xl panels, mono fits the numbers they carry.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs font-medium tabular-nums",
  {
    variants: {
      tone: {
        zinc: "border-zinc-800 bg-zinc-900 text-zinc-300",
        blurple: "border-blurple/40 bg-blurple/10 text-blurple-soft",
        green: "border-green-900 bg-green-950 text-green-300",
        amber: "border-amber-900 bg-amber-950 text-amber-300",
        red: "border-red-900 bg-red-950 text-red-300",
        blue: "border-blue-900 bg-blue-950 text-blue-300",
      },
    },
    defaultVariants: { tone: "zinc" },
  }
);

export function Badge({ tone, className, ...rest }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...rest} />;
}

// Chip stays because 20+ screens already import it; same voice as Badge.
export function Chip({ children, tone = "zinc" }) {
  return <Badge tone={tone}>{children}</Badge>;
}

// Structural skeleton for loading states.
export function Skeleton({ className, ...rest }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-zinc-800", className)} {...rest} />;
}

// One scroll reveal for section entrances: transform + opacity, ease-out, once.
// Dial is MOTION 1, so callers reserve this for the hero and the first proof
// section; everything else renders static. Static when reduced motion.
export function Reveal({ children, delay = 0, className, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} {...rest}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(14px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
// Animated integer for scores and stats. Static text when reduced motion.
export function CountUp({ to, className }) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, to, {
      duration: 0.3,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, reduce]);
  // Under reduced motion the value must come straight from props, not from state
  // seeded at mount. The corpus grows when live feeds land, and a readout frozen at
  // its pre-fetch number ends up printing a different total from the sentence below
  // it. A stat that contradicts its own prose is worse than an unanimated one.
  if (reduce) return <span className={cn("tabular-nums", className)}>{to}</span>;
  return (
    <span className={cn("tabular-nums", className)}>
      {val}
    </span>
  );
}

// Empty states name the cause and the one action that fills them.
export function Empty({ title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
      <p className="text-balance text-sm font-semibold text-zinc-100">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-pretty text-sm leading-6 text-zinc-400">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-900 bg-red-950 px-5 py-4 text-sm text-red-300" role="alert">
      <p className="font-semibold">Something failed to load</p>
      <p className="mt-1 text-pretty">{message}</p>
      {onRetry && (
        <Btn variant="quiet" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Btn>
      )}
    </div>
  );
}

// System figures for landing only: sharp 1px chrome, mono for measurement,
// square corners would fight the app radius, so these stay figure frames.

// Thin mono status strip: `left … right`. Kept mono because both slots carry
// readings (routes, versions, counts), never prose.
export function StatusBar({ left, right, className = "" }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 px-4 py-2", className)}>
      <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">{left}</span>
      {right && (
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">{right}</span>
      )}
    </div>
  );
}

// ASCII divider: `// label ─────`. The slashes are the motif; the label is
// prose, so sans semibold at AA-passing zinc.
export function AsciiRule({ label = "", className = "" }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-hidden>
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        {"//"} {label}
      </span>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

// Ticket is the landing figure frame, one level above Card, hence the
// stronger border. The header is prose, so sans; status is state, not action,
// so zinc instead of the blurple accent.
export function Ticket({ label, status, className = "", children, ...rest }) {
  return (
    <section className={cn("rounded-xl border border-zinc-700 bg-zinc-950", className)} {...rest}>
      {(label || status) && (
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            {label}
          </span>
          {status && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">
              {status}
            </span>
          )}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

// Terminal window for coach and CLI previews. Mono throughout because the
// body is literal terminal text; the url pill is fully round so it reads as
// an inner control inside the xl frame.
export function TermWindow({ url, children, className = "" }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950", className)}>
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[11px] text-zinc-400" aria-hidden>
          {">"} _
        </span>
        {url && (
          <span className="mx-auto hidden rounded-full bg-zinc-900 px-3 py-0.5 font-mono text-[11px] text-zinc-400 sm:block">
            {url}
          </span>
        )}
      </div>
      <div className="p-5 font-mono text-sm leading-6 text-zinc-300 sm:p-6">{children}</div>
    </div>
  );
}

// Growth display, beej to acharya. Read-only indicator, so one role="img"
// label instead of five tab stops; the dots stay hidden from AT.
export function VaidyaLevel({ level, className = "" }) {
  const stages = [
    { id: "beej", label: "बीज", hi: "seed" },
    { id: "ankur", label: "अंकुर", hi: "sprout" },
    { id: "paudha", label: "पौधा", hi: "seedling" },
    { id: "vaidya", label: "वैद्य", hi: "vaidya" },
    { id: "acharya", label: "आचार्य", hi: "acharya" },
  ];
  const idx = stages.findIndex((s) => s.id === level);
  const current = idx >= 0 ? stages[idx] : null;
  return (
    <div
      role="img"
      aria-label={current ? `Growth stage ${idx + 1} of 5: ${current.label} (${current.hi})` : "Growth stage unset"}
      className={`flex items-center gap-1.5 ${className}`}
    >
      {stages.map((s, i) => (
        <span
          key={s.id}
          aria-hidden
          className={`inline-flex size-6 items-center justify-center rounded-full border text-[10px] font-mono ${
            i <= idx ? "border-emerald-500 bg-emerald-600 text-white" : "border-zinc-700 text-zinc-500"
          }`}
        >
          {i + 1}
        </span>
      ))}
      <span aria-hidden className="ml-1 font-mono text-xs text-emerald-400">{current ? current.label : ""}</span>
    </div>
  );
}

// BAMS semester syllabus table. Empty input renders Empty, never nothing:
// a missing table reads as a failed load. Header is prose, so sans; cells
// carrying counts stay mono tabular.
export function SyllabusTable({ data = [], action }) {
  if (!data.length)
    return <Empty title="No syllabus rows yet" body="Syllabus rows for this lane have not been added yet." action={action} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <th scope="col" className="px-4 py-2 font-semibold">Semester</th>
            <th scope="col" className="px-4 py-2 font-semibold">Focus</th>
            <th scope="col" className="px-4 py-2 font-semibold">Skills</th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">Courses</th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">Quests</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.sem} className="border-t border-zinc-800 first:border-t-0">
              <td className="px-4 py-2.5 font-mono text-zinc-100">{row.sem}</td>
              <td className="px-4 py-2.5 text-zinc-300">{row.label}</td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {row.skills.map((s) => (
                    <span key={s} className="inline-block rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">{s}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-200">{row.courses}</td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-200">{row.quests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
