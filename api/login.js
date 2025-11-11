import { kv } from "@vercel/kv";
import { getSettings, sha256 } from "./_util.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { username, code } = await req.json();

  const s = await getSettings();

  // admin
  if (username === s.adminUser && sha256(code) === s.adminPinHash) {
    return new Response(JSON.stringify({ success: true, role: "admin", username }), { status: 200, headers: { "content-type": "application/json" } });
  }

  const list = (await kv.get("users:v1")) || [];
  const u = list.find(x => x.username === String(username).toLowerCase());
  if (!u || u.active === false) return new Response(JSON.stringify({ success: false }), { status: 200 });

  if (sha256(code) !== u.codeHash) return new Response(JSON.stringify({ success: false }), { status: 200 });
  return new Response(JSON.stringify({ success: true, role: "user", name: u.name, username: u.username }), { status: 200, headers: { "content-type": "application/json" } });
}
