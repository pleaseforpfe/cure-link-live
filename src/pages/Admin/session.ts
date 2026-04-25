const SESSION_KEY = "curelink_admin_session_v1";

export type AdminSession = {
  adminId: string;
  fullName: string;
  email: string;
  createdAt: string; // ISO
};

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}
