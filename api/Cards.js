import { kv } from "@vercel/kv";
import { requireAdmin } from "./_util.js";

export const config = { runtime: "edge" };

async function keyUser(user) { return `cards:${user}`; }

export default async function handler(req) {
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") || "").toLowerCase();

  if (req.method === "GET") {
    const since = parseInt(url.searchParams.get("sinceDays") || "7", 10);
    const list = (await kv.get(await keyUser(user))) || [];
    const t = Date.now() - since * 86400000;
    return new Response(JSON.stringify(list.filter(c => new Date(c.dateISO).getTime() >= t)), { status: 200, headers: { "content-type": "application/json" } });
  }

  // write ops: require either admin OR that header x-user matches user
  const admin = await requireAdmin(req);
  const hUser = (req.headers.get("x-user") || "").toLowerCase();
  if (!admin && (!hUser || hUser !== user)) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  if (req.method === "POST") {
    const body = await req.json();
    const list = (await kv.get(await keyUser(user))) || [];
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const card = {
      id,
      user,
      dateISO: body.dateISO || now,
      fields: body.fields || {},
      sent: !!body.sent,
      createdAt: body.createdAt || now,
      updatedAt: now
    };

    const ix = list.findIndex(c => c.id === id);
    if (ix === -1) list.unshift(card); else list[ix] = card;

    await kv.set(await keyUser(user), list);
    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { "content-type": "application/json" } });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const list = (await kv.get(await keyUser(user))) || [];
    const ix = list.findIndex(c => c.id === body.id);
    if (ix === -1) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    list[ix].sent = !!body.sent;
    list[ix].updatedAt = new Date().toISOString();
    await kv.set(await keyUser(user), list);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
