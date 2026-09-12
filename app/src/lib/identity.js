// ponytail: stable demo identity, real Auth post-Sept. Slice I owns the UI; Slice B needs the key now.
import { loadJSON, saveJSON, loadText, saveText } from "./storage.js";
const ID_KEY = "c2c-id";
const NICK_KEY = "c2c-nick";
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function getOrCreateC2CId() {
  try {
    let v = loadText(ID_KEY);
    if (!v) {
      v = "C2C-" + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
      saveText(ID_KEY, v);
    }
    return v;
  } catch {
    return "C2C-DEMO";
  }
}

export function loadNickname() {
  return loadText(NICK_KEY);
}

export function saveNickname(n) {
  saveText(NICK_KEY, (n || "").trim().slice(0, 24));
}

// --- portfolio profile (Slice F): cert log + github handle, local-first ---

const CERTS_KEY = "c2c-certs";
const GH_KEY = "c2c-github";

export function loadCerts() {
  return loadJSON(CERTS_KEY, []);
}

export function addCert({ issuer, title, url }) {
  const next = [...loadCerts(), {
    issuer: (issuer || "").trim(), title: (title || "").trim(),
    url: (url || "").trim(), at: Date.now(),
  }];
  saveJSON(CERTS_KEY, next);
  return next;
}

export function removeCert(at) {
  const next = loadCerts().filter((c) => c.at !== at);
  saveJSON(CERTS_KEY, next);
  return next;
}

export function loadGithub() {
  return loadText(GH_KEY);
}

export function saveGithub(h) {
  const v = (h || "").trim().replace(/^@/, "");
  saveText(GH_KEY, v);
  return v;
}
