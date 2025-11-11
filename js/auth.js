// js/auth.js
const AUTH_KEY = "arbejdskort_session";
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 min

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

export function isLoggedIn() {
  return !!getSessionUser();
}

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

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function guardOrShowLogin(loginId = "login-block", appId = "app-block") {
  const login = document.getElementById(loginId);
  const app = document.getElementById(appId);

  if (isLoggedIn()) {
    login?.setAttribute("hidden", "hidden");
    app?.removeAttribute("hidden");
    const chip = document.querySelector("[data-userchip]");
    if (chip) {
      const u = getSessionUser();
      chip.textContent = u ? `${u.name} (${u.username})` : "";
    }
  } else {
    app?.setAttribute("hidden", "hidden");
    login?.removeAttribute("hidden");
  }
}

// Midlertidig login indtil backend er klar
export async function employeeLogin(username, pin) {
  username = (username || "").trim().toLowerCase();
  pin = (pin || "").trim();

  if (!username || !pin) throw new Error("Udfyld brugernavn og kode.");

  // Du kan senere erstatte dette med et kald til din backend /api/login
  const demo = [
    { name: "Bent", username: "bh", pin: "1111", role: "user" },
    { name: "Per", username: "pbo", pin: "0705", role: "admin" },
  ];
  const user = demo.find((u) => u.username === username && u.pin === pin);
  if (!user) throw new Error("Forkert brugernavn/kode.");

  setSessionUser({ name: user.name, username: user.username, role: user.role });
  return user;
}

export function logoutAndReload() {
  clearSession();
  location.reload();
}

// Forlæng sessionen, når brugeren er aktiv
["click", "keydown", "pointerdown", "scroll"].forEach((ev) =>
  window.addEventListener(ev, touchSession, { passive: true })
);
