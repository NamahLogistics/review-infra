import express from 'express';
import { db } from './db';
import { logEvent } from './utils';

export const ordersRouter = express.Router();

ordersRouter.post('/', async (req, res) => {
  try {
    const {
      storeId,
      customerEmail,
      customerName,
      productId,
      orderRef,
      externalOrderId,
    } = req.body || {};

    if (!storeId || !customerEmail || !productId) {
      return res.status(400).json({ error: 'storeId, customerEmail and productId are required' });
    }

    const store = await db.store.findUnique({
      where: { id: String(storeId) },
      include: {
        settings: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const product = await db.product.findFirst({
      where: {
        storeId: store.id,
        OR: [
          { id: String(productId) },
          { externalId: String(productId) },
        ],
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found for this store' });
    }

    const sendDelayDays =
      store.settings?.sendDelayDays ??
      store.sendAfterDays ??
      3;

    const sendAfter = new Date(Date.now() + sendDelayDays * 24 * 60 * 60 * 1000);

    const finalExternalOrderId =
      String(externalOrderId || '').trim() ||
      `api:${store.id}:${product.id}:${customerEmail}:${Date.now()}`;

    const order = await db.reviewOrder.upsert({
      where: {
        storeId_externalOrderId_productId: {
          storeId: store.id,
          externalOrderId: finalExternalOrderId,
          productId: product.id,
        },
      },
      update: {
        customerName: customerName || null,
        customerEmail: String(customerEmail).trim(),
        orderRef: orderRef || null,
      },
      create: {
        storeId: store.id,
        productId: product.id,
        externalOrderId: finalExternalOrderId,
        customerName: customerName || null,
        customerEmail: String(customerEmail).trim(),
        orderRef: orderRef || null,
      },
    });

    const existingPendingOrSent = await db.reviewNudge.findFirst({
      where: {
        storeId: store.id,
        productId: product.id,
        customerEmail: String(customerEmail).trim(),
        status: {
          in: ['pending', 'sent'],
        },
      },
    });

    let nudge = existingPendingOrSent;

    if (!nudge) {
      nudge = await db.reviewNudge.create({
        data: {
          storeId: store.id,
          productId: product.id,
          customerName: customerName || null,
          customerEmail: String(customerEmail).trim(),
          orderRef: orderRef || null,
          status: 'pending',
          sendAfter,
        },
      });

      await logEvent({
        storeId: store.id,
        productId: product.id,
        nudgeId: nudge.id,
        type: 'nudge.api_created',
        payload: {
          source: 'orders_api',
          customerEmail: String(customerEmail).trim(),
          orderRef: orderRef || null,
          externalOrderId: finalExternalOrderId,
          sendAfter,
        },
      });
    }

    return res.json({
      success: true,
      orderId: order.id,
      nudgeId: nudge?.id || null,
      nudgeStatus: nudge?.status || null,
      sendAfter: nudge?.sendAfter || null,
      message: nudge
        ? 'Order received and review request queued.'
        : 'Order received.',
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Order failed' });
  }
});
