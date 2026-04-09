import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { shopifyRouter } from './shopify';
import { paddleRouter } from './paddle';
import { importCsvRouter } from './import-csv';
import { moderationRouter } from './moderation';
import { analyticsRouter } from './analytics';
import { productsRouter } from './products';
import { widgetRouter } from './widget';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'https://review-infra-web.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json());
app.use('/paddle', paddleRouter);

app.use('/shopify', shopifyRouter);
app.use('/import', importCsvRouter);
app.use('/moderation', moderationRouter);
app.use('/analytics', analyticsRouter);
app.use('/products', productsRouter);
app.use('/embed', widgetRouter);

app.get('/', (_req, res) => {
  res.send('Review Infra API running 🚀');
});

app.post('/auth/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const token = Buffer.from(email).toString('base64');

  res.json({
    token,
    email,
  });
});

app.get('/test-db', async (_req, res) => {
  const stores = await db.store.findMany();
  const products = await db.product.findMany();
  const reviews = await db.review.findMany();
  res.json({ stores, products, reviews });
});

app.get('/store/:id', async (req, res) => {
  const store = await db.store.findUnique({
    where: { id: req.params.id },
  });

  if (!store) return res.status(404).json({ error: 'Store not found' });

  res.json(store);
});

app.get('/store/:id/products', async (req, res) => {
  const products = await db.product.findMany({
    where: { storeId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(products);
});


app.get('/store/:id/by-external-product/:externalId', async (req, res) => {
  const product = await db.product.findFirst({
    where: {
      storeId: req.params.id,
      externalId: req.params.externalId,
    },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

app.get('/reviews/:productId', async (req, res) => {
  const apiKey = String(req.headers['x-api-key'] || '');
  const store = await db.store.findUnique({ where: { apiKey } });

  if (!store) return res.status(401).json({ error: 'Invalid API key' });

  const reviews = await db.review.findMany({
    where: {
      OR: [
        { productId: req.params.productId },
        { product: { externalId: req.params.productId } }
      ],
      storeId: store.id,
      status: 'approved',
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = reviews.length;
  const average =
    total > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total : 0;

  res.json({
    summary: {
      average: Number(average.toFixed(1)),
      total,
    },
    reviews,
  });
});

app.post('/create-store', async (req, res) => {
  const store = await db.store.create({
    data: {
      name: req.body?.name || 'Test Store',
      apiKey: 'test_' + Date.now(),
    },
  });
  res.json(store);
});

app.post('/create-product', async (req, res) => {
  const storeId = req.body?.storeId;
  const name = req.body?.name || 'Test Product';
  const externalId = req.body?.externalId || null;

  const product = await db.product.create({
    data: {
      name,
      externalId,
      storeId,
    },
  });

  res.json(product);
});

app.post('/create-review', async (req, res) => {
  const { productId, rating, text, title, authorName, authorEmail } = req.body;

  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const store = await db.store.findUnique({
    where: { id: product.storeId },
  });

  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  if (store.plan === 'free') {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const count = await db.review.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: monthStart,
        },
      },
    });

    if (count >= 50) {
      return res.status(403).json({
        error: 'Free plan limit reached. Upgrade to continue.',
      });
    }
  }

  const review = await db.review.create({
    data: {
      storeId: product.storeId,
      productId,
      rating,
      text,
      title: title || null,
      authorName: authorName || 'Anonymous',
      authorEmail: authorEmail || null,
      verified: false,
      source: 'manual',
      status: 'approved',
    },
  });

  res.json(review);
});

app.post('/upgrade', async (req, res) => {
  const { storeId } = req.body;

  const store = await db.store.update({
    where: { id: storeId },
    data: { plan: 'pro' },
  });

  res.json({ success: true, store });
});

app.get('/widget.js', (_req, res) => {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '../../packages/widget/embed/widget.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(fs.readFileSync(file, 'utf-8'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('API running on http://localhost:' + PORT);
});

app.post('/billing/checkout', async (req, res) => {
  const { storeId } = req.body;

  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const fakeCheckoutUrl = `https://sandbox-paddle-checkout.local/checkout?storeId=${store.id}`;
  res.json({ checkoutUrl: fakeCheckoutUrl });
});

