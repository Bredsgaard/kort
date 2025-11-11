import { kv } from '@vercel/kv';

async function getAdmin() {
  const s = (await kv.get('ak:settings')) || {};
  return {
    adminUser: s.adminUser || 'Bonde',
    adminPin:  s.adminPin  || '0705',
    settings:  s
  };
}
async function adminOK(req) {
  const { adminUser, adminPin } = await getAdmin();
  return (req.headers['x-admin-user'] === adminUser && req.headers['x-admin-pin'] === adminPin);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { settings } = await getAdmin();
      const { adminPin, ...safe } = settings || {};
      return res.json(safe || {});
    }

    if (!(await adminOK(req))) return res.status(401).json({ ok:false, error:'unauthorized' });
import { requireAdmin, getSettings, saveSettings, sha256 } from "./_util.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "GET") {
    const s = await getSettings();
    // vis ikke pin-hash
    const { adminPinHash, ...pub } = s;
    return new Response(JSON.stringify(pub), { status: 200, headers: { "content-type": "application/json" } });
  }

  if (req.method === "POST") {
    const ok = await requireAdmin(req);
    if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const body = await req.json();
    const s = await getSettings();

    if (typeof body.adminUser === "string" && body.adminUser.trim()) s.adminUser = body.adminUser.trim();
    if (typeof body.newAdminPin === "string" && body.newAdminPin.trim().length >= 4) s.adminPinHash = sha256(body.newAdminPin.trim());

    if (Array.isArray(body.emailTo)) s.emailTo = body.emailTo.filter(Boolean);
    if (typeof body.mailSubjectPrefix === "string") s.mailSubjectPrefix = body.mailSubjectPrefix;
    if (typeof body.mailFooter === "string") s.mailFooter = body.mailFooter;
    if (Array.isArray(body.requiredFields)) s.requiredFields = body.requiredFields;
    if (Number.isInteger(body.keepDays)) s.keepDays = Math.max(1, Math.min(31, body.keepDays));

    if (Array.isArray(body.workTypes)) s.workTypes = body.workTypes.map(x => String(x).trim()).filter(Boolean);
    if (Array.isArray(body.consumables)) {
      s.consumables = body.consumables
        .map(c => ({ name: String(c.name || "").trim(), unit: String(c.unit || "").trim() }))
        .filter(c => c.name);
    }

    await saveSettings(s);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

    if (req.method === 'POST') {
      const incoming = req.body || {};
      const current  = (await kv.get('ak:settings')) || {};
      const next = { ...current, ...incoming };
      // overskriv kun adminPin hvis der er angivet en ny
      if (!incoming.adminPin) delete next.adminPin;
      await kv.set('ak:settings', next);
      return res.json({ ok:true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ ok:false, error:'server' });
  }
}


