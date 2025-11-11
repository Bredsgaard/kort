// js/auth.js
const AUTH_KEY = "arbejdskort_session_v1";
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutter

function now() { return Date.now(); }

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.expiresAt || s.expiresAt < now()) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return s.user;
  } catch {
    return null;
  }
}

export function isLoggedIn() { return !!getSessionUser(); }

export function setSessionUser(user) {
  const sess = { user, expiresAt: now() + SESSION_TTL_MS };
  localStorage.setItem(AUTH_KEY, JSON.stringify(sess));
}

export function touchSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    s.expiresAt = now() + SESSION_TTL_MS;
    localStorage.setItem(AUTH_KEY, JSON.stringify(s));
  } catch {}
}

export function clearSession() { localStorage.removeItem(AUTH_KEY); }

export function guar

