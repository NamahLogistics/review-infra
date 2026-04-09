import express from 'express';
import { db } from './db';

export const importCsvRouter = express.Router();

importCsvRouter.post('/csv', async (req, res) => {
  const { storeId, rows } = req.body;

  if (!storeId || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'storeId and rows are required' });
  }

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
        rating: Number(row.rating || 5),
        title: row.title || null,
        text: row.text || '',
        status: 'approved',
        verified: false,
        source: 'csv',
      },
    });

    created.push(review);
  }

  res.json({ success: true, count: created.length, reviews: created });
});
