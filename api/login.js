import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { username, code } = req.body || {};
    if (!username || !code) return res.status(400).json({ ok: false, error: 'missing' });

    const users = (await kv.get('ak:users')) || [];
    const u = users.find(x =>
      (x.username || '').toLowerCase() === String(username).toLowerCase()
      && String(x.code) === String(code)
      && x.active !== false
    );

    if (!u) return res.status(401).json({ ok: false });

    // returnér uden kode
    const { name, username: un } = u;
    res.json({ ok: true, user: { name, username: un } });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server' });
  }
}

