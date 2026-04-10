import express from 'express';
import { db } from './db';
import { z } from 'zod';
import { requireStore } from './middleware/auth';

export const importCsvRouter = express.Router();

const schema = z.object({
  rows: z.array(
    z.object({
      productName: z.string(),
      rating: z.number().min(1).max(5),
      text: z.string(),
      title: z.string().optional(),
      authorName: z.string().optional(),
      authorEmail: z.string().optional(),
      externalId: z.string().optional(),
    })
  ),
});

importCsvRouter.post('/csv', requireStore, async (req: any, res) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { rows } = parsed.data;
  const storeId = req.store.id;

  const created: any[] = [];

  for (const row of rows) {
    let product = await db.product.findFirst({
      where: {
        storeId,
        name: row.productName,
      },
    });

    if (!product) {
      product = await db.product.create({
        data: {
          storeId,
          name: row.productName,
          externalId: row.externalId || null,
        },
      });
    }

    const review = await db.review.create({
      data: {
        storeId,
        productId: product.id,
        authorName: row.authorName || 'Anonymous',
        authorEmail: row.authorEmail || null,
        rating: row.rating,
        title: row.title || null,
        text: row.text,
        status: 'approved',
        verified: false,
        source: 'csv',
      },
    });

    created.push(review);
  }

  res.json({ success: true, count: created.length, reviews: created });
});
