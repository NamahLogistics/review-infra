import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const storesRouter = express.Router();

const createStoreSchema = z.object({
  name: z.string().min(2),
});

storesRouter.get('/', requireUser, async (req: any, res) => {
  const stores = await db.store.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(stores);
});

storesRouter.post('/', requireUser, async (req: any, res) => {
  const parsed = createStoreSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const store = await db.store.create({
    data: {
      userId: req.user.id,
      name: parsed.data.name,
      apiKey: crypto.randomBytes(16).toString('hex'),
    },
  });

  res.json(store);
});
