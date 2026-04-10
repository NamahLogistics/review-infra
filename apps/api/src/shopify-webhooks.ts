import express from 'express';
import crypto from 'crypto';

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
  '/orders-create',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    const hmacHeader = String(req.headers['x-shopify-hmac-sha256'] || '');
    const rawBody = req.body as Buffer;

    if (!secret) {
      return res.status(500).send('Missing SHOPIFY_WEBHOOK_SECRET');
    }

    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      return res.status(401).send('Invalid webhook signature');
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).send('Invalid JSON');
    }

    const shopDomain = String(req.headers['x-shopify-shop-domain'] || '');
    const store = await (await import('./db')).db.store.findUnique({
      where: { shopDomain },
    });

    if (!store) {
      return res.status(404).send('Store not found');
    }

    const customerEmail =
      payload?.email ||
      payload?.customer?.email ||
      null;

    if (!customerEmail) {
      return res.status(200).json({ success: true, skipped: 'missing_customer_email' });
    }

    const customerName =
      [payload?.customer?.first_name, payload?.customer?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || null;

    const items = Array.isArray(payload?.line_items)
      ? payload.line_items
          .map((item: any) => ({
            productId: item?.product_id ? String(item.product_id) : null,
          }))
          .filter((item: any) => item.productId)
      : [];

    if (!items.length) {
      return res.status(200).json({ success: true, skipped: 'no_product_line_items' });
    }

    const ingestRes = await fetch(`http://127.0.0.1:${process.env.PORT || 4000}/auto-nudges/ingest-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: store.apiKey,
        externalOrderId: payload?.id ? String(payload.id) : undefined,
        orderRef: payload?.name || (payload?.id ? String(payload.id) : undefined),
        customerName: customerName || undefined,
        customerEmail,
        items,
      }),
    });

    const ingestJson = await ingestRes.json();
    return res.status(200).json(ingestJson);
  }
);
