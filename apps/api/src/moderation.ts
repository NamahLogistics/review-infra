import express from 'express';
import { db } from './db';

export const moderationRouter = express.Router();

moderationRouter.get('/store/:storeId/reviews', async (req, res) => {
  const reviews = await db.review.findMany({
    where: { storeId: req.params.storeId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: true,
    },
  });

  res.json(Array.isArray(reviews) ? reviews : []);
});

moderationRouter.patch('/reviews/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const review = await db.review.update({
    where: { id: req.params.id },
    data: { status },
  });

  res.json(review);
});
