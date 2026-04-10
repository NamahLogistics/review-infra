import express from 'express';
import { db } from './db';
import { requireStore } from './middleware/auth';

export const productsRouter = express.Router();

productsRouter.post('/upsert', requireStore, async (req: any, res) => {
  const { externalId, name } = req.body;

  if (!externalId) {
    return res.status(400).json({ error: 'externalId required' });
  }

  let product = await db.product.findFirst({
    where: { externalId, storeId: req.store.id },
  });

  if (!product) {
    product = await db.product.create({
      data: {
        storeId: req.store.id,
        externalId,
        name: name || 'Product',
      },
    });
  }

  res.json(product);
});
