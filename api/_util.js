// /api/_util.js  (EDGE-VERSION)
import { kv } from "@vercel/kv";

// SHA-256 via Web Crypto (Edge) -> hex
export async function sha256(str) {
  const enc = new TextEncoder().encode(String(str));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getSettings() {
  const s = await kv.get("settings:v1");
  return s || {
    adminUser: "Bonde",
    adminPinHash: await sha256("0705"),
    emailTo: ["pb@bredsgaard.dk"],
    mailSubjectPrefix: "Arbejdskort",
    mailFooter: "Venlig hilsen\nBredsgaard A/S",
    requiredFields: ["dato", "arbejdet_art", "udfoert"],
    keepDays: 7,
    workTypes: ["Service", "Olieskift", "Kædeskift"],
    consumables: [{ name: "Olie", unit: "L" }, { name: "Elektroder", unit: "stk" }]
  };
}

export async function saveSettings(s) {
  await kv.set("settings:v1", s);
}

// Admin-check: kræver headers x-admin-user + x-admin-pin
export async function requireAdmin(req) {
  const s = await getSettings();
  const u = req.headers.get("x-admin-user");
  const p = req.headers.get("x-admin-pin");
  if (!u || !p) return false;
  return u === s.adminUser && (await sha256(p)) === s.adminPinHash;
}

// Fjern kode-hashes når vi viser brugere i UI
export function scrubUsers(users) {
  return (users || []).map(u => ({
    name: u.name,
    username: u.username,
    active: u.active !== false
  }));
}
