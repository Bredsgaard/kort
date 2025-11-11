// js/app.js
export const SETTINGS_KEY = "ak_settings_v1";
export const USERS_KEY = "ak_users_v1";
const CARDS_PREFIX = "ak_cards_"; // gemmes pr. bruger i localStorage

// ---------- Settings ----------
export function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) { try { return JSON.parse(raw); } catch {} }
  const def = {
    appName: "Arbejdskort",
    mailTo: "pb@bredsgaard.dk",
    required: {
      date: true,
      machineNo: true,
      machineHours: false,
      drivenKm: false,
      weldingHours: false,
      electrodes: false,
      diesel: false,
      normalHours: true,
      overtimeHours: false,
      workType: true,
      customer: false,
      description: true
    }
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(def));
  return def;
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ---------- Users ----------
export function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) { try { return JSON.parse(raw); } catch {} }
  const demo = [
    { name: "Bent", username: "bh",  pin: "1111", active: true, role: "user"  },
    { name: "Per Bonde", username: "pbo", pin: "0705", active: true, role: "admin" },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(demo));
  return demo;
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---------- Cards ----------
export function cardsKey(username) {
  return CARDS_PREFIX + (username || "__nouser__");
}

export function getCards(username) {
  const raw = localStorage.getItem(cardsKey(username));
  if (raw) { try { return JSON.parse(raw); } catch {} }
  return [];
}

export function saveCards(username, list) {
  localStorage.setItem(cardsKey(username), JSON.stringify(list));
}

export function addOrUpdateCard(username, card) {
  const list = getCards(username);
  const idx = list.findIndex(c => c.id === card.id);
  if (idx >= 0) list[idx] = card; else list.unshift(card);
  saveCards(username, list);
  return list;
}

// ---------- Utils ----------
export function id() {
  return "C" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("da-DK", { year:"numeric", month:"2-digit", day:"2-digit" });
  } catch { return d; }
}

