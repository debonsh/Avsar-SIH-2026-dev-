// ponytail: one guarded store. localStorage throws outside browsers (node --test,
// SSR) and on quota — every helper degrades to the fallback instead of crashing.
const hasLS = () => typeof localStorage !== "undefined";

export function loadJSON(key, fb) {
  try {
    if (!hasLS()) return fb;
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fb;
  } catch {
    return fb;
  }
}

export function saveJSON(key, val) {
  try {
    if (!hasLS()) return false;
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch {
    return false;
  }
}

export function loadText(key, fb = "") {
  try {
    if (!hasLS()) return fb;
    return localStorage.getItem(key) ?? fb;
  } catch {
    return fb;
  }
}

export function saveText(key, val) {
  try {
    if (!hasLS()) return false;
    localStorage.setItem(key, val);
    return true;
  } catch {
    return false;
  }
}
