// Kør på Edge-runtime (krævet af Vercel Edge Functions)
export const config = { runtime: "edge" };

import { getSettings, saveSettings, requireAdmin, sha256 } from "./_util.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async function handler(req) {
  const method = req.method || (req.headers.get(":method") ?? "GET");

  // Hent aktuelle indstillinger
  if (method === "GET") {
    const s = await getSettings();
    return json(s);
  }

  // Opdater indstillinger (adminkrævet)
  if (method === "POST") {
    const ok = await requireAdmin(req);
    if (!ok) return json({ error: "forbidden" }, 403);

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const s = await getSettings();

    // Kun felter vi tillader må opdateres
    const allowed = new Set([
      "adminUser",
      "emailTo",
      "mailSubjectPrefix",
      "mailFooter",
      "requiredFields",
      "keepDays",
      "workTypes",
      "consumables",
    ]);

    for (const [k, v] of Object.entries(body)) {
      if (k === "newAdminPin") continue; // håndteres seperat
      if (allowed.has(k)) s[k] = v;
    }

    // Hvis admin vil skifte PIN
    if (typeof body?.newAdminPin === "string" && body.newAdminPin.length >= 4) {
      s.adminPinHash = await sha256(body.newAdminPin);
    }

    await saveSettings(s);
    return json({ ok: true });
  }

  // Preflight / andet
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "access-control-allow-methods": "GET,POST,OPTIONS" },
    });
  }

  return json({ error: "method_not_allowed" }, 405);
}
