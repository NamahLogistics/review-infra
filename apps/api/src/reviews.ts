import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { requireStore } from './middleware/auth';

export const reviewsRouter = express.Router();

const listSchema = z.object({
  productId: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
  rating: z.coerce.number().min(1).max(5).optional(),
});

function getOrderBy(sort: 'newest' | 'oldest' | 'highest' | 'lowest') {
  if (sort === 'oldest') return [{ createdAt: 'asc' as const }];
  if (sort === 'highest') return [{ rating: 'desc' as const }, { createdAt: 'desc' as const }];
  if (sort === 'lowest') return [{ rating: 'asc' as const }, { createdAt: 'desc' as const }];
  return [{ createdAt: 'desc' as const }];
}

reviewsRouter.get('/admin/list/:productId', requireStore, async (req: any, res) => {
  const parsed = listSchema.safeParse({
    productId: req.params.productId,
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
    rating: req.query.rating,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { productId, page, limit, sort, rating } = parsed.data;

  const product = await db.product.findFirst({
    where: {
      storeId: req.store.id,
      OR: [
        { id: productId },
        { externalId: productId },
      ],
    },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const where: any = {
    storeId: req.store.id,
    productId: product.id,
  };

  if (rating) {
    where.rating = rating;
  }

  const total = await db.review.count({ where });

  const reviews = await db.review.findMany({
    where,
    orderBy: getOrderBy(sort),
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});

reviewsRouter.get('/:productId', requireStore, async (req: any, res) => {
  const parsed = listSchema.safeParse({
    productId: req.params.productId,
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
    rating: req.query.rating,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { productId, page, limit, sort, rating } = parsed.data;

  const product = await db.product.findFirst({
    where: {
      storeId: req.store.id,
      OR: [
        { id: productId },
        { externalId: productId },
      ],
    },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const where: any = {
    storeId: req.store.id,
    productId: product.id,
    status: 'approved',
  };

  if (rating) {
    where.rating = rating;
  }

  const total = await db.review.count({ where });

  const reviews = await db.review.findMany({
    where,
    orderBy: getOrderBy(sort),
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      rating: true,
      title: true,
      text: true,
      authorName: true,
      verified: true,
      source: true,
      createdAt: true,
    },
  });

  const allApproved = await db.review.findMany({
    where: {
      storeId: req.store.id,
      productId: product.id,
      status: 'approved',
    },
    select: {
      rating: true,
    },
  });

  const totalApproved = allApproved.length;
  const average =
    totalApproved > 0
      ? allApproved.reduce((sum, r) => sum + r.rating, 0) / totalApproved
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((value) => ({
    rating: value,
    count: allApproved.filter((r) => r.rating === value).length,
  }));

  res.json({
    product: {
      id: product.id,
      externalId: product.externalId,
      name: product.name,
    },
    summary: {
      average: Number(average.toFixed(1)),
      total: totalApproved,
      breakdown,
    },
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    filters: {
      sort,
      rating: rating || null,
    },
  });
});
