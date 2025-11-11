import { kv } from "@vercel/kv";
import { sha256, requireAdmin, scrubUsers } from "./_util.js";

export const config = { runtime: "edge" };

async function loadUsers() {
  return (await kv.get("users:v1")) || [];
}
async function saveUsers(list) {
  await kv.set("users:v1", list);
}

export default async function handler(req) {
  if (req.method === "GET") {
    const list = await loadUsers();
    return new Response(JSON.stringify(scrubUsers(list)), { status: 200, headers: { "content-type": "application/json" } });
  }

  const isAdmin = await requireAdmin(req);
  if (!isAdmin) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  if (req.method === "POST") {
    const body = await req.json();
    let { name, username, code, active } = body;
    if (!name || !username) return new Response(JSON.stringify({ error: "missing" }), { status: 400 });

    username = String(username).toLowerCase().replace(/\s+/g, "");
    let list = await loadUsers();
    const ix = list.findIndex(u => u.username === username);
    if (ix === -1 && !code) return new Response(JSON.stringify({ error: "need_code" }), { status: 400 });

    if (ix === -1) {
      list.push({ name, username, active: active !== false, codeHash: sha256(code) });
    } else {
      list[ix].name = name;
      if (typeof active === "boolean") list[ix].active = active;
      if (code) list[ix].codeHash = sha256(code);
    }
    await saveUsers(list);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }

  if (req.method === "DELETE") {
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get("username") || "").toLowerCase();
    if (!username) return new Response(JSON.stringify({ error: "missing" }), { status: 400 });
    let list = await loadUsers();
    list = list.filter(u => u.username !== username);
    await saveUsers(list);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
