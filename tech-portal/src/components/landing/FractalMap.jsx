// Pixel fractal map — download(10) pixel-splat + shipping harbor stripes.
// Seeded value-noise fBm, blocky canvas, slow drift + edge shimmer.
// Palette: mono | harbor (blue) | rainbow. Static when reduced-motion/offscreen.
// ponytail: one rAF loop, ~12fps redraws, dpr capped at 1, disconnects on unmount.
import { useEffect, useRef } from "react";

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function landColor(palette, n, x, y) {
  if (palette === "rainbow") {
    const h = Math.floor(n * 360 + x * 0.5 + y * 0.3) % 360;
    return `hsl(${h} 85% 60% / ${0.55 + n * 0.45})`;
  }
  if (palette === "harbor") return `rgba(88,101,242,${0.35 + n * 0.65})`;
  return `rgba(228,228,231,${0.25 + n * 0.75})`;
}

export default function FractalMap({
  palette = "harbor",
  pixel = 10,
  seed = 7,
  drift = 0.015,
  className = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const rand = mulberry32(seed);
    const cw = 24;
    const ch = 14;
    const grid = Array.from({ length: ch + 1 }, () =>
      Array.from({ length: cw + 1 }, () => rand())
    );
    const smooth = (t) => t * t * (3 - 2 * t);
    const noise = (nx, ny) => {
      const gx = ((nx % 1) + 1) % 1 * cw;
      const gy = ((ny % 1) + 1) % 1 * ch;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = smooth(gx - x0);
      const fy = smooth(gy - y0);
      const a = grid[y0][x0];
      const b = grid[y0][Math.min(x0 + 1, cw)];
      const c = grid[Math.min(y0 + 1, ch)][x0];
      const d = grid[Math.min(y0 + 1, ch)][Math.min(x0 + 1, cw)];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };

    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = true;

    const render = (frame) => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== Math.ceil(w / pixel)) canvas.width = Math.ceil(w / pixel);
      if (canvas.height !== Math.ceil(h / pixel)) canvas.height = Math.ceil(h / pixel);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const gw = canvas.width;
      const gh = canvas.height;
      ctx.clearRect(0, 0, gw, gh);
      // edge shimmer: threshold breathes per frame, cheap pseudo-random per cell
      const shimmer = ((frame * 0.37) % 1) * 0.02;

      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const nx = x / gw + t;
          const ny = y / gh + t * 0.6;
          const n =
            noise(nx, ny) * 0.55 + noise(nx * 2, ny * 2) * 0.3 + noise(nx * 4, ny * 4) * 0.15;
          // harbor valley: carve out center-bottom like shipping illustration
          const valley = Math.abs(x / gw - 0.5) * 1.6 + Math.max(0, 0.35 - y / gh) * 0.8;
          const v = n - valley * 0.28 + shimmer;
          if (v > 0.52) {
            ctx.fillStyle = landColor(palette, (v - 0.52) * 2, x, y);
            ctx.fillRect(x, y, 1, 1);
          } else if (v > 0.46 && (x + y + frame) % 3 === 0) {
            // checker edge, download(10) transition, crawls one cell per frame
            ctx.fillStyle = landColor(palette, 0.15, x, y);
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      render(0);
      return undefined;
    }

    let frame = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (now - last < 90) return; // ~11fps is plenty for pixels
      last = now;
      frame += 1;
      t += drift * 0.09;
      render(frame);
    };

    const ro = new ResizeObserver(() => render(frame));
    ro.observe(parent);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    render(0);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [palette, pixel, seed, drift]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
