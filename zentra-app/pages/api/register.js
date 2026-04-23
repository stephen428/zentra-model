import redis from '../../lib/redis';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const emailKey = 'user:' + email.toLowerCase();
  const existing = await redis.get(emailKey);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await redis.set(emailKey, { name, email: email.toLowerCase(), passwordHash, createdAt: Date.now() });

  return res.status(200).json({ ok: true });
}
