import { kv } from '@vercel/kv';

async function getAdmin() {
  const s = (await kv.get('ak:settings')) || {};
  return {
    adminUser: s.adminUser || 'Bonde',
    adminPin:  s.adminPin  || '0705'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { username, code } = req.body || {};
    if (!username || !code) return res.status(400).json({ ok:false, error:'missing' });

    const users = (await kv.get('ak:users')) || [];
    const u = users.find(x =>
      (x.username || '').toLowerCase() === String(username).toLowerCase() &&
      String(x.code) === String(code) &&
      x.active !== false
    );

    // tillad også admin-login som bruger (praktisk til første test)
    const { adminUser, adminPin } = await getAdmin();
    const adminMatch = (String(username) === adminUser && String(code) === adminPin);

    if (!u && !adminMatch) return res.status(401).json({ ok:false });

    const user = u ? { name: u.name, username: u.username } : { name:'Admin', username: adminUser };
    res.json({ ok:true, user });
  } catch (e) {
    res.status(500).json({ ok:false, error:'server' });
  }
}
