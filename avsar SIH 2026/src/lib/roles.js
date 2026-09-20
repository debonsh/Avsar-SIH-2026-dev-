// ponytail: single-track portal — every student is a BAMS track student.
// The role state doubles as the track; default ayush so every page renders
// the Ayurveda feed with zero branching.
import { loadText, saveText } from "./storage.js";
export const APP_ROLES = [
  { value: "ayush", label: "Ayush Professional (BAMS)" },
];

const KEY = "c2c-role";

export function loadRole() {
  const v = loadText(KEY, "ayush");
  return APP_ROLES.some((r) => r.value === v) ? v : "ayush";
}

export function saveRole(v) {
  saveText(KEY, v);
}
