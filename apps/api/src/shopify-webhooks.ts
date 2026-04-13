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

shopifyWebhooksRouter.post(
  '/app-uninstalled',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    const hmacHeader = String(req.headers['x-shopify-hmac-sha256'] || '');
    const rawBody = req.body as Buffer;

    if (!secret) return res.status(500).send('Missing SHOPIFY_WEBHOOK_SECRET');

    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      return res.status(401).send('Invalid webhook signature');
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).send('Invalid JSON');
    }

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
