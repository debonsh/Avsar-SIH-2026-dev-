// ponytail: local-first analytics ring buffer. No backend, no PII, ~30 lines.
// Funnel: track("quiz_done") etc → read with readEvents() in console or export later.
import { loadJSON, saveJSON } from "./storage.js";

const KEY = "c2c-events-v1";
const CAP = 200;

export function track(evt = "", data = {}) {
  if (!evt) return;
  try {
    const log = loadJSON(KEY, []);
    log.push({ evt, t: Date.now(), ...data });
    saveJSON(KEY, log.slice(-CAP));
  } catch { /* never break demo */ }
}

export function readEvents() {
  try { return loadJSON(KEY, []); } catch { return []; }
}

export function funnel(base = []) {
  const log = readEvents();
  const out = {};
  for (const e of base) out[e] = log.filter((l) => l.evt === e).length;
  return out;
}
