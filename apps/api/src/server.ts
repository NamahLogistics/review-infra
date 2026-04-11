import rateLimit from "express-rate-limit";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import { shopifyRouter } from './shopify';
import { paddleRouter } from './paddle';
import { importCsvRouter } from './import-csv';
import { moderationRouter } from './moderation';
import { analyticsRouter } from './analytics';
import { productsRouter } from './products';
import { widgetRouter } from './widget';
import { requireStore } from './middleware/auth';
import { userAuthRouter } from './user-auth';
import { storesRouter } from './stores';
import { reviewsRouter } from './reviews';
import { trackingRouter } from './tracking';
import { publicReviewsRouter } from './public-reviews';
import { reviewNudgesRouter } from './review-nudges';
import { autoNudgesRouter } from './auto-nudges';
import { shopifyWebhooksRouter } from './shopify-webhooks';
import { cronRouter } from './cron';
import fs from 'fs';

dotenv.config();

const app = express();
app.set('trust proxy', 1); 


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(cors({
  origin: [
    'https://review-infra-web.vercel.app',
    process.env.APP_BASE_URL!
  ],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'authorization']
}));

app.use(express.json());
app.use(limiter);

app.use('/paddle', paddleRouter);
app.use('/shopify', shopifyRouter);
app.use('/import', importCsvRouter);
app.use('/moderation', moderationRouter);
app.use('/analytics', analyticsRouter);
app.use('/products', productsRouter);
const widgetPath = path.resolve(process.cwd(), 'public', 'embed');
const widgetFile = path.join(widgetPath, 'widget.js');

console.log('Widget path:', widgetPath);
console.log('Widget exists:', fs.existsSync(widgetFile), widgetFile);

app.use('/embed', express.static(widgetPath));

app.use('/auth', userAuthRouter);
app.use('/stores', storesRouter);
app.use('/reviews', reviewsRouter);
app.use('/tracking', trackingRouter);
app.use('/public-reviews', publicReviewsRouter);
app.use('/review-nudges', reviewNudgesRouter);
app.use('/auto-nudges', autoNudgesRouter);
app.use('/shopify-webhooks', shopifyWebhooksRouter);
app.use('/cron', cronRouter);

app.get('/', (_req, res) => {
  res.send('Review Infra API running');
});

app.get('/store/:id', requireStore, async (req: any, res) => {
  res.json(req.store);
});

app.get('/store/:id/products', requireStore, async (req: any, res) => {
  const products = await db.product.findMany({
    where: { storeId: req.store.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

app.get('/store/:id/by-external-product/:externalId', requireStore, async (req: any, res) => {
  const product = await db.product.findFirst({
    where: {
      storeId: req.store.id,
      externalId: req.params.externalId,
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found' });

  res.json(product);
});

app.get('/reviews/:productId', requireStore, async (req: any, res) => {
  const reviews = await db.review.findMany({
    where: {
      OR: [
        { productId: req.params.productId },
        { product: { externalId: req.params.productId } }
      ],
      storeId: req.store.id,
      status: 'approved',
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = reviews.length;
  const avg = total ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / total : 0;

  res.json({
    summary: { average: Number(avg.toFixed(1)), total },
    reviews,
  });
});

app.post('/upgrade', async (req, res) => {
  const { storeId } = req.body;
  const store = await db.store.update({
    where: { id: storeId },
    data: { plan: 'pro' },
  });
  res.json({ success: true, store });
});

app.post('/billing/checkout', async (req, res) => {
  const { storeId } = req.body;

  if (!process.env.PADDLE_API_KEY || !process.env.PADDLE_PRICE_ID) {
    return res.status(500).json({ error: 'Paddle is not configured' });
  }

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const paddleRes = await fetch('https://api.paddle.com/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          price_id: process.env.PADDLE_PRICE_ID,
          quantity: 1,
        },
      ],
      custom_data: {
        storeId: store.id,
      },
    }),
  });

  const paddleJson: any = await paddleRes.json();

  const checkoutUrl =
    paddleJson?.data?.checkout?.url ||
    paddleJson?.data?.checkout_url ||
    null;

  if (!checkoutUrl) {
    return res.status(500).json({ error: 'Failed to create checkout', details: paddleJson });
  }

  res.json({ checkoutUrl });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('API running on http://localhost:' + PORT);
});
