import express from 'express';
import crypto from 'crypto';
import { db } from './db';

export const shopifyRouter = express.Router();

async function syncProducts(shop: string, accessToken: string, storeId: string) {
  const query = `
    query Products {
      products(first: 50) {
        nodes {
          id
          title
        }
      }
    }
  `;

  const res = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query }),
  });

  const json: any = await res.json();
  const products = json?.data?.products?.nodes || [];

  for (const product of products) {
    await db.product.upsert({
      where: { externalId: product.id },
      update: {
        name: product.title,
        storeId,
      },
      create: {
        name: product.title,
        externalId: product.id,
        storeId,
      },
    });
  }

  return products.length;
}

shopifyRouter.get('/auth/start', async (req, res) => {
  const shop = String(req.query.shop || '');
  if (!shop) return res.status(400).send('Missing shop');

  const clientId = process.env.SHOPIFY_CLIENT_ID || '';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI || '';
  const state = crypto.randomBytes(16).toString('hex');
  const scopes = 'read_products';

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(installUrl);
});

shopifyRouter.get('/auth/callback', async (req, res) => {
  const shop = String(req.query.shop || '');
  const code = String(req.query.code || '');

  if (!shop || !code) {
    return res.status(400).send('Missing shop or code');
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token || null;

  const store = await db.store.upsert({
    where: { shopDomain: shop },
    update: {
      name: shop,
      accessToken,
    },
    create: {
      name: shop,
      shopDomain: shop,
      accessToken,
      apiKey: crypto.randomBytes(16).toString('hex'),
    },
  });

  if (accessToken) {
    await syncProducts(shop, accessToken, store.id);
  }

  res.redirect(`http://localhost:3000/dashboard?storeId=${store.id}`);
});

shopifyRouter.post('/sync-products', async (req, res) => {
  const { storeId } = req.body;

  if (!storeId) {
    return res.status(400).json({ error: 'storeId required' });
  }

  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!store?.shopDomain || !store?.accessToken) {
    return res.status(400).json({ error: 'Store not connected to Shopify' });
  }

  const count = await syncProducts(store.shopDomain, store.accessToken, store.id);
  res.json({ success: true, synced: count });
});
