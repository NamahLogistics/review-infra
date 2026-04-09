import express from 'express';
import { db } from './db';

export const productsRouter = express.Router();

// create or get product by externalId (Shopify product id)
productsRouter.post('/upsert', async (req, res) => {
  const { storeId, externalId, name } = req.body;

  if (!storeId || !externalId) {
    return res.status(400).json({ error: 'storeId and externalId required' });
  }

  let product = await db.product.findFirst({
    where: { externalId, storeId },
  });

  if (!product) {
    product = await db.product.create({
      data: {
        storeId,
        externalId,
        name: name || 'Product',
      },
    });
  }

  res.json(product);
});
