import express from 'express';
import crypto from 'crypto';
import { db } from './db';

export const paddleRouter = express.Router();

paddleRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = String(req.headers['paddle-signature'] || '');
  const secret = process.env.PADDLE_WEBHOOK_SECRET || '';
  const rawBody = req.body.toString();

  if (!secret) {
    return res.status(500).send('Missing PADDLE_WEBHOOK_SECRET');
  }

  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  if (signature && signature !== hmac) {
    return res.status(400).send('Invalid signature');
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const storeId = payload?.data?.custom_data?.storeId || payload?.custom_data?.storeId || null;
  const eventType = payload?.event_type || 'unknown';

  if (storeId) {
    await db.billingEvent.create({
      data: {
        storeId,
        provider: 'paddle',
        eventType,
        rawBody,
      },
    });

    if (
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated' ||
      eventType === 'transaction.completed'
    ) {
      await db.store.update({
        where: { id: String(storeId) },
        data: { plan: 'pro' },
      });
    }

    if (
      eventType === 'subscription.canceled' ||
      eventType === 'subscription.past_due'
    ) {
      await db.store.update({
        where: { id: String(storeId) },
        data: { plan: 'free' },
      });
    }
  }

  res.json({ ok: true });
});
