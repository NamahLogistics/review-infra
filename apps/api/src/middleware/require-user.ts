import jwt from 'jsonwebtoken';
import { db } from '../db';

export async function requireUser(req: any, res: any, next: any) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const secret = process.env.JWT_SECRET || '';
  if (!secret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' });
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
