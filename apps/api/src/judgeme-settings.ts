import express from 'express';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const judgeMeRouter = express.Router();

judgeMeRouter.post('/:storeId', requireUser, async (req: any, res) => {
  const { storeId } = req.params;
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token required' });

  const store = await db.store.findFirst({
    where: { id: storeId, userId: req.user.id },
  });

  if (!store) return res.status(404).json({ error: 'Store not found' });

  const updated = await db.store.update({
    where: { id: storeId },
    data: {
      judgeMeToken: token,
      judgeMeConnectedAt: new Date(),
    },
    select: {
      judgeMeToken: true,
      judgeMeConnectedAt: true,
    },
  });

  res.json({
    success: true,
    connected: !!updated.judgeMeToken,
    token: updated.judgeMeToken || '',
    connectedAt: updated.judgeMeConnectedAt,
  });
});

judgeMeRouter.get('/:storeId', requireUser, async (req: any, res) => {
  const store = await db.store.findFirst({
    where: { id: req.params.storeId, userId: req.user.id },
    select: {
      judgeMeToken: true,
      judgeMeConnectedAt: true,
    },
  });

  if (!store) return res.status(404).json({ error: 'Store not found' });

  res.json({
    success: true,
    connected: !!store.judgeMeToken,
    token: store.judgeMeToken || '',
    connectedAt: store.judgeMeConnectedAt,
  });
});
