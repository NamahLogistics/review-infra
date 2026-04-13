import express from 'express';
import crypto from 'crypto';
import { db } from './db';

export const shopifyWebhooksRouter = express.Router();

function verifyShopifyHmac(rawBody: Buffer, hmacHeader: string, secret: string) {
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader || '');

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyOrReject(req: any, res: any) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET || '';
  const hmacHeader = String(req.headers['x-shopify-hmac-sha256'] || '');
  const rawBody = req.body as Buffer;

  if (!secret) {
    res.status(500).send('Missing Shopify webhook secret');
    return null;
  }

  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).send('Invalid raw body');
    return null;
  }

  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    res.status(401).send('Invalid webhook signature');
    return null;
  }

  return rawBody;
}

shopifyWebhooksRouter.post(
  '/app-uninstalled',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = verifyOrReject(req, res);
    if (!rawBody) return;

    const shopDomain = String(req.headers['x-shopify-shop-domain'] || '').toLowerCase();

    const store = await db.store.findUnique({
      where: { shopDomain },
    });

    if (!store) return res.status(404).send('Store not found');

    await db.store.update({
      where: { id: store.id },
      data: {
        accessToken: null,
        shopifyRefreshToken: null,
        shopifyAccessTokenExpiresAt: null,
        shopifyRefreshTokenExpiresAt: null,
        connectionStatus: 'uninstalled',
        shopifyUninstalledAt: new Date(),
      },
    });

    return res.status(200).json({ success: true });
  }
);

shopifyWebhooksRouter.post(
  '/customers-data-request',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = verifyOrReject(req, res);
    if (!rawBody) return;
    return res.status(200).json({ success: true });
  }
);

shopifyWebhooksRouter.post(
  '/customers-redact',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = verifyOrReject(req, res);
    if (!rawBody) return;
    return res.status(200).json({ success: true });
  }
);

shopifyWebhooksRouter.post(
  '/shop-redact',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = verifyOrReject(req, res);
    if (!rawBody) return;
    return res.status(200).json({ success: true });
  }
);
