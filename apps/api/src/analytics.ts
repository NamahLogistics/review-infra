import express from 'express';
import { db } from './db';

export const analyticsRouter = express.Router();

analyticsRouter.get('/store/:storeId', async (req, res) => {
  const storeId = req.params.storeId;

  const reviews = await db.review.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
          ).toFixed(1),
        )
      : 0;

  const approved = reviews.filter((r) => r.status === 'approved').length;
  const pending = reviews.filter((r) => r.status === 'pending').length;
  const rejected = reviews.filter((r) => r.status === 'rejected').length;

  const byRating = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  res.json({
    totalReviews,
    averageRating,
    approved,
    pending,
    rejected,
    byRating,
  });
});
