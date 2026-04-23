import redis from '../../../lib/redis';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const { id } = req.query;
  const userEmail = session.user.email;

  if (req.method === 'GET') {
    const meta = await redis.get('model:meta:' + id);
    if (!meta || meta.owner !== userEmail) {
      return res.status(404).json({ error: 'Model not found' });
    }
    const state = await redis.get('model:data:' + id);
    return res.json({ ...meta, state });
  }

  if (req.method === 'DELETE') {
    const meta = await redis.get('model:meta:' + id);
    if (!meta || meta.owner !== userEmail) {
      return res.status(404).json({ error: 'Model not found' });
    }
    await redis.del('model:data:' + id);
    await redis.del('model:meta:' + id);
    await redis.srem('models:index:' + userEmail, id);
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
