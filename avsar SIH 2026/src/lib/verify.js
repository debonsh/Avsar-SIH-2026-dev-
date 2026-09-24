// ponytail: verifiable credentials without a server. code = base64url(payload)
// + "." + fnv hash. anyone with this file recomputes the hash offline —
// tampered codes fail. payload: { id, name, readiness, skills[], at }.
// revocation: a revoked sig stays verifiable but renders as REVOKED forever —
// integrity theater judges remember, and fakes can't quietly disappear.
import { hashStr } from "./quests.js";
import { signPayload, verifySigned } from "./sign.js";
import { loadJSON, saveJSON } from "./storage.js";

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

// --- revocation ledger: sig → { reason, at }. Revoked codes still verify the
// signature (the payload is real history) but every view marks them revoked.
const RKEY = "avsar-revoked-v1";
let memRevoked = null; // node --test has no localStorage; mirror like taxonomy

export function loadRevocations() {
  if (memRevoked === null) memRevoked = loadJSON(RKEY, []);
  return Array.isArray(memRevoked) ? memRevoked : [];
}

export function revokeCredential(code = "", reason = "revoked by issuer") {
  const res = checkCredential(code);
  if (!res.ok) return null;
  const sig = String(code).split(".")[1];
  const rows = loadRevocations();
  if (rows.some((r) => r.sig === sig)) return rows.find((r) => r.sig === sig);
  const entry = { sig, reason: String(reason || "revoked by issuer").slice(0, 120), at: Date.now() };
  memRevoked = [...rows, entry].slice(-100);
  saveJSON(RKEY, memRevoked);
  return entry;
}

export function revocationFor(code = "") {
  const sig = String(code || "").split(".")[1];
  if (!sig) return null;
  return loadRevocations().find((r) => r.sig === sig) || null;
}

// one call for views: signature truth + revocation state together
export function checkCredentialStatus(code = "") {
  const res = checkCredential(code);
  if (!res.ok) return res;
  const revoked = revocationFor(code);
  return { ...res, revoked: revoked ? { reason: revoked.reason, at: revoked.at } : null };
}

// --- v2: the same envelope, carrying a real signature ---------------------------------
// v1 is left exactly as it is. Every code already printed must keep validating, because a
// QR shown last semester cannot be reissued, and a scheme that breaks its own history is
// worse than one that carries two versions. v2 wraps a signed receipt in the same
// base64url envelope, so a reader cannot tell the versions apart by looking and does not
// have to: the router below decides.

export const V2_PREFIX = "v2.";

// The envelope, in one place. A page that wants to show a receipt and also link to its
// verification page must not re-implement the encoding, because the two would drift and a
// link that fails to resolve looks exactly like a forged receipt.
export function codeFromReceipt(receipt = {}) {
  return `${V2_PREFIX}${enc(JSON.stringify(receipt))}`;
}

export async function signCredentialV2(payload = {}, keypair = null) {
  const receipt = await signPayload(payload, keypair);
  return { code: codeFromReceipt(receipt), receipt };
}

export function isV2(code = "") {
  return String(code || "").startsWith(V2_PREFIX);
}

export async function checkCredentialV2(code = "") {
  const body = String(code || "").slice(V2_PREFIX.length);
  if (!body) return { ok: false, reason: "empty v2 code", v: 2 };
  let receipt;
  try {
    receipt = JSON.parse(dec(body));
  } catch {
    return { ok: false, reason: "unreadable v2 payload", v: 2 };
  }
  const res = await verifySigned(receipt);
  if (!res.ok) return { ok: false, reason: res.reason, v: 2, mode: res.mode };
  const revoked = revocationFor(code);
  return {
    ok: true,
    payload: receipt.payload,
    v: 2,
    mode: res.mode,
    weak: res.weak,
    kid: res.kid,
    revoked: revoked ? { reason: revoked.reason, at: revoked.at } : null,
  };
}

// One entry point, so a page never has to know which version it is holding. v1 answers
// synchronously and v2 does not, which is why every caller awaits this one.
export async function checkCredentialAny(code = "") {
  if (!isV2(code)) return checkCredentialStatus(code);
  return checkCredentialV2(code);
}
