// ponytail: 4 demo roles persist in localStorage, real Auth is post-Sept
import { loadText, saveText } from "./storage.js";
export const APP_ROLES = [
  { value: "student", label: "Student" },
  { value: "industry", label: "Industry" },
  { value: "faculty", label: "Faculty" },
  { value: "institute", label: "Institute" },
];

const KEY = "c2c-role";

export function loadRole() {
  const v = loadText(KEY, "student");
  return APP_ROLES.some((r) => r.value === v) ? v : "student";
}

export function saveRole(v) {
  saveText(KEY, v);
}
