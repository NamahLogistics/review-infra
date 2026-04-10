import { db } from '../db';

export async function requireStore(req: any, res: any, next: any) {
  const apiKey = String(req.headers['x-api-key'] || '');

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const store = await db.store.findUnique({
    where: { apiKey },
  });

  if (!store) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.store = store;
  next();
}
