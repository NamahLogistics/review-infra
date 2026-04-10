import express from 'express';
import { db } from './db';
import { requireStore } from './middleware/auth';

export const moderationRouter = express.Router();

moderationRouter.get('/store/:storeId/reviews', requireStore, async (req: any, res) => {
  const reviews = await db.review.findMany({
    where: { storeId: req.store.id },
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });

  res.json(reviews);
});

moderationRouter.patch('/reviews/:id/status', requireStore, async (req: any, res) => {
  const { status } = req.body;

  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const review = await db.review.findFirst({
    where: { id: req.params.id, storeId: req.store.id },
  });

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const updated = await db.review.update({
    where: { id: review.id },
    data: { status },
  });

  res.json(updated);
});
