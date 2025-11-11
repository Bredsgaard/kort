import { kv } from "@vercel/kv";
import crypto from "node:crypto";

export async function getSettings() {
  const s = await kv.get("settings:v1");
  // standarder første gang
  return s || {
    adminUser: "Bonde",
    adminPinHash: sha256("0705"),
    emailTo: ["pb@bredsgaard.dk"],
    mailSubjectPrefix: "Arbejdskort",
    mailFooter: "Venlig hilsen\nBredsgaard A/S",
    requiredFields: ["dato", "arbejdet_art", "udfoert"],
    keepDays: 7,
    workTypes: ["Service", "Olieskift", "Kædeskift"],
    consumables: [{ name: "Olie", unit: "L" }, { name: "Elektroder", unit: "stk" }]
  };
}

export function sha256(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

export async function saveSettings(s) {
  await kv.set("settings:v1", s);
}

export async function requireAdmin(req) {
  const s = await getSettings();
  const u = req.headers.get("x-admin-user");
  const p = req.headers.get("x-admin-pin");
  if (!u || !p) return false;
  return u === s.adminUser && sha256(p) === s.adminPinHash;
}

export function scrubUsers(users) {
  return (users || []).map(u => ({ name: u.name, username: u.username, active: u.active !== false }));
}
