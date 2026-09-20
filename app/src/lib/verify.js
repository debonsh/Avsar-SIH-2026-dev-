// ponytail: verifiable credentials without a server. code = base64url(payload)
// + "." + fnv hash. anyone with this file recomputes the hash offline —
// tampered codes fail. payload: { id, name, readiness, skills[], at }.
import { hashStr } from "./quests.js";

const enc = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s) => {
  try {
    const b = s.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(b)));
  } catch {
    return null;
  }
};

export function signCredential(p = {}) {
  const payload = {
    id: String(p.id || "local"),
    name: String(p.name || "avsar student").slice(0, 60),
    readiness: Math.max(0, Math.min(100, Math.round(p.readiness || 0))),
    skills: (p.skills || []).map(String).slice(0, 12),
    at: Date.now(),
  };
  const body = enc(JSON.stringify(payload));
  const sig = hashStr(`avsar-v1:${body}`).toString(36);
  return `${body}.${sig}`;
}

export function checkCredential(code = "") {
  const [body, sig] = String(code || "").split(".");
  if (!body || !sig) return { ok: false, reason: "malformed code" };
  if (hashStr(`avsar-v1:${body}`).toString(36) !== sig) return { ok: false, reason: "signature mismatch — tampered or forged" };
  try {
    const payload = JSON.parse(dec(body));
    if (!payload || !payload.id) return { ok: false, reason: "empty payload" };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "unreadable payload" };
  }
}

export function verifyUrl(code = "") {
  return `/verify/${encodeURIComponent(code)}`;
}
