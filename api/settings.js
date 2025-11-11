import { kv } from '@vercel/kv';

const ADMIN_USER = 'Bonde';
const ADMIN_PIN  = '0705';
const KEY = 'ak:settings';

function adminOK(req) {
  return (req.headers['x-admin-user'] === ADMIN_USER && req.headers['x-admin-pin'] === ADMIN_PIN);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const cfg = (await kv.get(KEY)) || {};
      return res.json(cfg);
    }

    if (!adminOK(req)) return res.status(401).json({ ok:false, error:'unauthorized' });

    if (req.method === 'POST') {
      const cfg = req.body || {};
      await kv.set(KEY, cfg);
      return res.json({ ok:true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ ok:false, error:'server' });
  }
}

