// [ayush] admin gate. allowlist via VITE_ADMIN_EMAILS (comma separated).
// allowlist empty → prototype mode: any signed-in user administers, labeled.
// guests never pass. rollback: delete src/ayush/.
export function adminEmails() {
  try {
    return String(import.meta?.env?.VITE_ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function isAdmin(user = null) {
  if (!user?.email) return false;
  const list = adminEmails();
  if (!list.length) return true; // prototype mode
  return list.includes(String(user.email).toLowerCase());
}

export function gateLabel() {
  return adminEmails().length
    ? "restricted to allowlisted emails"
    : "prototype mode: any signed-in google account";
}
