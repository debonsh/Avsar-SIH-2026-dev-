// Avsar UI primitives — shadcn pattern (cva variants + Slot + clsx/tailwind-merge),
// dark minimal world, one blurple accent. Same export surface so all routes work.
// Typeset roles: Archivo display, Inter body, system mono for measurement only.
import { useEffect, useRef, useState } from "react";
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

export function Card({ className = "", children, ...rest }) {
  return (
    <section className={cn("rounded-xl border border-zinc-800 bg-zinc-950 p-5", className)} {...rest}>
      {children}
    </section>
  );
}

export function H2({ children, className = "" }) {
  return <h2 className={cn("mb-3 text-sm font-semibold text-zinc-100", className)}>{children}</h2>;
}

const buttonVariants = cva(
  "inline-flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
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
        icon: "size-10 min-h-0",
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

// Legacy alias — every page already imports Btn.
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

export const inputCls =
  "flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-700";

export function Meter({ value, max }) {
  const reduce = useReducedMotion();
  const pct = `${Math.min(100, (value / max) * 100)}%`;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-zinc-800"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} of ${max}`}
    >
      <motion.div
        className="h-full rounded-full bg-blurple"
        initial={reduce ? { width: pct } : { width: "0%" }}
        whileInView={{ width: pct }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

const DONUT_COLORS = ["#5865f2", "#e4e4e7", "#d97706", "#6366f1", "#a1a1aa", "#52525b"];

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
          transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
        />
      ))}
    </svg>
  );
}

export const DONUT_COLORS_EXPORT = DONUT_COLORS;

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-medium tabular-nums",
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

// Legacy alias.
export function Chip({ children, tone = "zinc" }) {
  return <Badge tone={tone}>{children}</Badge>;
}

// Structural skeleton for loading states.
export function Skeleton({ className, ...rest }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-zinc-800", className)} {...rest} />;
}

// One scroll reveal for section entrances: transform + opacity, ease-out, once.
export function Reveal({ children, delay = 0, className, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} {...rest}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(14px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Animated integer for scores and stats. Static text when reduced motion.
export function CountUp({ to, className }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [val, setVal] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, to, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, reduce]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
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
    <div
      className="rounded-xl border border-red-900 bg-red-950 px-5 py-4 text-sm text-red-200"
      role="alert"
    >
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
