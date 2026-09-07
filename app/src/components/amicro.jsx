// amicro: vendored micro-transition primitives (fade-up, text-reveal, magnetic, tilt, segmented)
// patterned on https://amicro.vercel.app — CSS + motion only, no extra registry weight
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

export function FadeUp({ delay = 0, y = 14, className = "", children, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({ text, delay = 0, className = "", step = 0.035 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + i * step, ease: EASE }}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

// amicro pressable: stills on hover, 1px lift + 0.98 press — no cursor-chasing
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

// amicro tilt-card: max 3deg — presence without playfulness
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
            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-100"}`}
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

// amicro progress-step-bar: spring-animated meter for ATS breakdown
export function Meter({ value, max, tone = "bg-white" }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`h-full rounded-full ${tone}`}
      />
    </div>
  );
}
