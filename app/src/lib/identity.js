// ponytail: stable demo identity, real Auth post-Sept. Slice I owns the UI; Slice B needs the key now.
const ID_KEY = "c2c-id";
const NICK_KEY = "c2c-nick";
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function getOrCreateC2CId() {
  try {
    let v = localStorage.getItem(ID_KEY);
    if (!v) {
      v = "C2C-" + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
      localStorage.setItem(ID_KEY, v);
    }
    return v;
  } catch {
    return "C2C-DEMO";
  }
}

export function loadNickname() {
  try {
    return localStorage.getItem(NICK_KEY) || "";
  } catch {
    return "";
  }
}

export function saveNickname(n) {
  try {
    localStorage.setItem(NICK_KEY, (n || "").trim().slice(0, 24));
  } catch { /* ignore */ }
}

// --- portfolio profile (Slice F): cert log + github handle, local-first ---

const CERTS_KEY = "c2c-certs";
const GH_KEY = "c2c-github";

export function loadCerts() {
  try {
    return JSON.parse(localStorage.getItem(CERTS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function addCert({ issuer, title, url }) {
  const next = [...loadCerts(), {
    issuer: (issuer || "").trim(), title: (title || "").trim(),
    url: (url || "").trim(), at: Date.now(),
  }];
  try {
    localStorage.setItem(CERTS_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function removeCert(at) {
  const next = loadCerts().filter((c) => c.at !== at);
  try {
    localStorage.setItem(CERTS_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function loadGithub() {
  try {
    return localStorage.getItem(GH_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGithub(h) {
  const v = (h || "").trim().replace(/^@/, "");
  try {
    localStorage.setItem(GH_KEY, v);
  } catch { /* ignore */ }
  return v;
}
