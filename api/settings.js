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


