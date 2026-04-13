import rateLimit from "express-rate-limit";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import { shopifyRouter } from './shopify';
import { shopifyInstallRouter } from './shopify-install';
import { paddleRouter } from './paddle';
import { importCsvRouter } from './import-csv';
import { moderationRouter } from './moderation';
import { analyticsRouter } from './analytics';
import { productsRouter } from './products';
import { requireStore } from './middleware/auth';
import { userAuthRouter } from './user-auth';
import { storesRouter } from './stores';
import { reviewsRouter } from './reviews';
import { trackingRouter } from './tracking';
import { publicReviewsRouter } from './public-reviews';
import { widgetConfigRouter } from './widget-config';
import { reviewNudgesRouter } from './review-nudges';
import { autoNudgesRouter } from './auto-nudges';
import { shopifyWebhooksRouter } from './shopify-webhooks';
import { cronRouter } from './cron';
import { reviewSettingsRouter } from './review-settings';
import { judgeMeRouter } from "./judgeme-settings";
import { importJudgeMeRouter } from './import-judgeme';
import { testEmailRouter } from './test-email';
import { reviewRequestRouter } from './review-request';
import { ordersRouter } from './orders';
import fs from 'fs';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use('/shopify-webhooks', shopifyWebhooksRouter);

app.use(express.json());
app.use(limiter);

const widgetPath = path.resolve(process.cwd(), 'public', 'embed');
const widgetFile = path.join(widgetPath, 'widget.js');

console.log('Widget path:', widgetPath);
console.log('Widget exists:', fs.existsSync(widgetFile), widgetFile);

/**
 * Public embed assets
 */
app.use('/embed', cors({ origin: true }));
app.use('/embed', express.static(widgetPath));

/**
 * Public review fetch for widgets on any site
 */
app.use('/reviews', cors({
  origin: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

/**
 * Public review submit from any site
 */
app.use('/public-reviews', cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use('/widget-config', cors({
  origin: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

/**
 * Private app/dashboard routes
 */
app.use(cors({
  origin: [
    'https://reviewinfra.dev',
    'https://www.reviewinfra.dev',
    'https://docs.reviewinfra.dev',
    'https://review-infra-web.vercel.app',
    process.env.APP_BASE_URL!,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'authorization'],
}));
app.use('/judgeme', judgeMeRouter);
app.use('/review-request', reviewRequestRouter);
app.use('/paddle', paddleRouter);
app.use('/shopify', shopifyRouter);
app.use('/shopify', shopifyInstallRouter);
app.use('/import', importCsvRouter);
app.use('/import', importJudgeMeRouter);
app.use('/moderation', moderationRouter);
app.use('/analytics', analyticsRouter);
app.use('/products', productsRouter);
app.use('/auth', userAuthRouter);
app.use('/stores', storesRouter);
app.use('/reviews', reviewsRouter);
app.use('/tracking', trackingRouter);
app.use('/public-reviews', publicReviewsRouter);
app.use('/widget-config', widgetConfigRouter);
app.use('/review-nudges', reviewNudgesRouter);
app.use('/auto-nudges', autoNudgesRouter);
app.use('/cron', cronRouter);
app.use('/review-settings', reviewSettingsRouter);
app.use('/test-email', testEmailRouter);
app.use('/orders', ordersRouter);
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
