import express from 'express';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const storeSettingsRouter = express.Router();

storeSettingsRouter.patch('/:id/settings', requireUser, async (req: any, res) => {
  const { id } = req.params;
  const { autoReviewEnabled, sendAfterDays, maxReminders } = req.body;

  const store = await db.store.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!store) return res.status(404).json({ error: 'Store not found' });

  const updated = await db.store.update({
    where: { id },
    data: {
      ...(autoReviewEnabled !== undefined && { autoReviewEnabled }),
      ...(sendAfterDays !== undefined && { sendAfterDays }),
      ...(maxReminders !== undefined && { maxReminders }),
    },
  });

  res.json(updated);
});

storeSettingsRouter.get('/:id/settings', requireUser, async (req: any, res) => {
  const { id } = req.params;

  const store = await db.store.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!store) return res.status(404).json({ error: 'Store not found' });

  res.json({
    autoReviewEnabled: store.autoReviewEnabled,
    sendAfterDays: store.sendAfterDays,
    maxReminders: store.maxReminders,
  });
});
