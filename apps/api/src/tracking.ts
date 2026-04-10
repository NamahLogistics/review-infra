import express from 'express';
import { db } from './db';
import { logEvent } from './utils';
import { ok, fail } from './http';

export const trackingRouter = express.Router();

trackingRouter.get('/nudge/open/:id', async (req, res) => {
  const nudge = await db.reviewNudge.findUnique({
    where: { id: req.params.id },
  });

  if (!nudge) {
    return res.status(404).json(fail('Nudge not found'));
  }

  if (!nudge.openedAt) {
    await db.reviewNudge.update({
      where: { id: nudge.id },
      data: { openedAt: new Date() },
    });

    await logEvent({
      storeId: nudge.storeId,
      productId: nudge.productId,
      nudgeId: nudge.id,
      type: 'nudge.opened',
      payload: {
        customerEmail: nudge.customerEmail,
      },
    });
  }

  const pixel = Buffer.from(
    'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    'base64'
  );

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', pixel.length);
  res.status(200).send(pixel);
});

trackingRouter.get('/nudge/click/:id', async (req, res) => {
  const nudge = await db.reviewNudge.findUnique({
    where: { id: req.params.id },
    include: {
      store: true,
      product: true,
    },
  });

  if (!nudge) {
    return res.status(404).json(fail('Nudge not found'));
  }

  if (!nudge.clickedAt) {
    await db.reviewNudge.update({
      where: { id: nudge.id },
      data: { clickedAt: new Date() },
    });

    await logEvent({
      storeId: nudge.storeId,
      productId: nudge.productId,
      nudgeId: nudge.id,
      type: 'nudge.clicked',
      payload: {
        customerEmail: nudge.customerEmail,
      },
    });
  }

  const submitUrl =
    `${process.env.APP_BASE_URL}/submit-review?` +
    `apiKey=${encodeURIComponent(nudge.store.apiKey)}` +
    `&productId=${encodeURIComponent(nudge.product.externalId || nudge.product.id)}` +
    `&authorName=${encodeURIComponent(nudge.customerName || '')}` +
    `&authorEmail=${encodeURIComponent(nudge.customerEmail)}`;

  res.redirect(submitUrl);
});

trackingRouter.get('/events', async (_req, res) => {
  const events = await db.reviewEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(ok(events));
});
