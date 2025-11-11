// /api/users.js
import { kv } from '@vercel/kv';

const ADMIN_USER = 'Bonde';
const ADMIN_PIN  = '0705';

function adminOK(req) {
  return (req.headers['x-admin-user'] === ADMIN_USER && req.headers['x-admin-pin'] === ADMIN_PIN);
}

export default async function handler(req, res) {
  // GET = list
  if (req.method === 'GET') {
    const users = (await kv.get('ak:users')) || [];
    // returnér uden kode
    return res.json(users.map(({ code, ...rest }) => rest));
  }

  if (!adminOK(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });

  // POST = create/update
  if (req.method === 'POST') {
    const { name, username, code, active } = req.body || {};
    if (!name || !username) return res.status(400).json({ ok: false, error: 'missing' });

    const list = (await kv.get('ak:users')) || [];
    const idx = list.findIndex(u => (u.username || '').toLowerCase() === String(username).toLowerCase());

    if (idx >= 0) {
      list[idx] = { ...list[idx], name, username, ...(code ? { code } : {}), active: active !== false };
    } else {
      if (!code) return res.status(400).json({ ok: false, error: 'need_code' });
      list.push({ name, username: String(username).toLowerCase(), code: String(code), active: true });
    }

    await kv.set('ak:users', list);
    return res.json({ ok: true });
  }

  // DELETE /api/users?username=xx
  if (req.method === 'DELETE') {
    const { username } = req.query;
    if (!username) return res.status(400).json({ ok:false, error:'missing' });

    let list = (await kv.get('ak:users')) || [];
    list = list.filter(u => (u.username || '').toLowerCase() !== String(username).toLowerCase());
    await kv.set('ak:users', list);
    return res.json({ ok: true });
  }

  // PATCH toggle active
  if (req.method === 'PATCH') {
    const { username, active } = req.body || {};
    if (!username) return res.status(400).json({ ok:false, error:'missing' });

    const list = (await kv.get('ak:users')) || [];
    const idx = list.findIndex(u => (u.username || '').toLowerCase() === String(username).toLowerCase());
    if (idx < 0) return res.status(404).json({ ok:false });

    list[idx].active = !!active;
    await kv.set('ak:users', list);
    return res.json({ ok:true });
  }

  res.status(405).end();
}
