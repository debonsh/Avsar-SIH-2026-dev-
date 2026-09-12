// ponytail: 4 demo roles persist in localStorage, real Auth is post-Sept
export const APP_ROLES = [
  { value: "student", label: "Student" },
  { value: "industry", label: "Industry" },
  { value: "faculty", label: "Faculty" },
  { value: "institute", label: "Institute" },
];

const KEY = "c2c-role";

export function loadRole() {
  try {
    const v = localStorage.getItem(KEY);
    return APP_ROLES.some((r) => r.value === v) ? v : "student";
  } catch {
    return "student";
  }
}

export function saveRole(v) {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
}
