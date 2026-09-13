// amicro: vendored micro-transition primitives (fade-up, text-reveal, magnetic, tilt, segmented)
// patterned on https://amicro.vercel.app, CSS + motion only, no extra registry weight
// operate-mode: fast and quiet. Durations short, movement small, static under reduced-motion.
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

export function FadeUp({ delay = 0, y = 8, className = "", children, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} {...rest}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(delay, 0.12), ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({ text, delay = 0, className = "", step = 0.018 }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: delay + i * step, ease: EASE }}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

// amicro pressable: stills on hover, 1px lift + 0.98 press, no cursor-chasing
export function Lift({ children, className = "", ...rest }) {
  return (
    <motion.span
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: EASE }}
      style={{ display: "inline-flex" }}
      className={className}
      {...rest}
    >
      {children}
    </motion.span>
  );
}

// amicro tilt-card: max 3deg, presence without playfulness
export function Tilt({ className = "", children, ...rest }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 300, damping: 22 });
  const sry = useSpring(ry, { stiffness: 300, damping: 22 });
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 6);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// amicro segmented-tabs: sliding light pill on dark, toggle sfx via cuelume
export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-lg p-1 ${className}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            data-cuelume-toggle
            onClick={() => onChange(o.value)}
            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-100"}`}
          >
            {active && (
              <motion.span layoutId="seg-pill" transition={{ duration: 0.3, ease: EASE }} className="absolute inset-0 bg-white rounded-md" />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ponytail: eye-candy reward pop — spring scale + fade, reduced-motion safe, auto-dismiss by parent
export function Burst({ children, className = "", ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} {...rest}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ponytail: rank-up modal — one overlay, no lib, esc/backdrop dismiss
export function RankUp({ rank, onClose, onShowcase }) {
  const reduce = useReducedMotion();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <motion.div
        initial={reduce ? {} : { opacity: 0, scale: 0.9, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-zinc-900 p-6 text-center"
      >
        <div className="text-4xl">🏅</div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mt-2">Rank up</div>
        <div className="text-3xl font-extrabold mt-1">{rank}</div>
        <p className="text-xs text-zinc-400 mt-2">Showcase-ready. Your portfolio ticks carry this — share it.</p>
        <div className="flex gap-2 mt-4">
          <button onClick={onShowcase} className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-white text-zinc-950 cursor-pointer">Showcase →</button>
          <button onClick={onClose} className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-white/10 text-zinc-300 cursor-pointer">Keep going</button>
        </div>
      </motion.div>
    </div>
  );
}

// ponytail: CSS transition, not JS animation, keystroke re-scores glide instead of replaying
export function Meter({ value, max, tone = "bg-white" }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tone}`}
      />
    </div>
  );
}
