import redis from '../../../lib/redis';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const userEmail = session.user.email;

  if (req.method === 'GET') {
    const keys = await redis.smembers('models:index:' + userEmail);
    if (!keys || keys.length === 0) return res.json([]);

    const models = await Promise.all(
      keys.map(async (id) => {
        const meta = await redis.get('model:meta:' + id);
        return meta;
      })
    );

    const sorted = models
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return res.json(sorted);
  }

  if (req.method === 'POST') {
    const { id, name, state } = req.body;
    if (!name || !state) return res.status(400).json({ error: 'Missing name or state' });

    const modelId = id || (userEmail + ':' + Date.now());
    const now = Date.now();

    await redis.set('model:data:' + modelId, state);
    await redis.set('model:meta:' + modelId, {
      id: modelId,
      name,
      owner: userEmail,
      createdAt: id ? undefined : now,
      updatedAt: now,
    });
    await redis.sadd('models:index:' + userEmail, modelId);

    return res.json({ id: modelId });
  }

  return res.status(405).end();
}
