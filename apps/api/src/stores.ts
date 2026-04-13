import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const storesRouter = express.Router();

const createStoreSchema = z.object({
  storeType: z.enum(["shopify","custom"]).optional(),
  name: z.string().min(2).max(80),
});

const updateStoreSchema = z.object({
  name: z.string().min(2).max(80),
});

storesRouter.get('/', requireUser, async (req: any, res) => {
  const stores = await db.store.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(stores);
});

storesRouter.post('/', requireUser, async (req: any, res) => {
  const parsed = createStoreSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const store = await db.store.create({
    data: {
      userId: req.user.id,
      name: parsed.data.name.trim(),
      storeType: parsed.data.storeType || 'shopify',
      apiKey: crypto.randomBytes(16).toString('hex'),
      connectionStatus: 'draft',
    },
  });

  res.json(store);
});

storesRouter.patch('/:id', requireUser, async (req: any, res) => {
  const parsed = updateStoreSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await db.store.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const updated = await db.store.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name.trim(),
    },
  });

  res.json(updated);
});

storesRouter.delete('/:id', requireUser, async (req: any, res) => {
  const existing = await db.store.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Store not found' });
  }

  await db.store.delete({
    where: { id: existing.id },
  });

  res.json({ success: true, deletedStoreId: existing.id });
});


storesRouter.get('/:id/stats', async (req, res) => {
  try {
    const storeId = req.params.id

    const [products, approved, pending] = await Promise.all([
      db.product.count({ where: { storeId } }),
      db.review.count({ where: { storeId, status: 'approved' } }),
      db.review.count({ where: { storeId, status: 'pending' } }),
    ])

    return res.json({
      success: true,
      stats: {
        products,
        approvedReviews: approved,
        pendingReviews: pending,
      }
    })
  } catch (e: any) {
    return res.status(400).json({ error: e.message })
  }
})


storesRouter.get('/:id/setup-status', requireUser, async (req: any, res) => {
  const store = await db.store.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      settings: true,
    },
  })

  if (!store) {
    return res.status(404).json({ error: 'Store not found' })
  }

  const [productsCount, approvedReviewsCount, pendingReviewsCount, importedReviewsCount] = await Promise.all([
    db.product.count({ where: { storeId: store.id } }),
    db.review.count({ where: { storeId: store.id, status: 'approved' } }),
    db.review.count({ where: { storeId: store.id, status: 'pending' } }),
    db.review.count({ where: { storeId: store.id, source: 'judgeme_import' } }),
  ])

  res.json({
    success: true,
    setup: {
      shopifyConnected: store.connectionStatus === 'connected',
      productsSyncedCount: productsCount,
      judgeMeConnected: !!store.judgeMeToken,
      importedReviewsCount,
      reviewRequestsEnabled: !!store.settings?.isEnabled,
      pendingModerationCount: pendingReviewsCount,
      emailSettingsReady: !!store.settings?.emailSubject && !!store.settings?.emailBody,
      testEmailReady: !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM,
    },
  })
})


storesRouter.get('/:id/overview', requireUser, async (req: any, res) => {
  const store = await db.store.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: {
      settings: true,
    },
  })

  if (!store) {
    return res.status(404).json({ error: 'Store not found' })
  }

  const [
    products,
    approvedReviews,
    pendingReviews,
    importedReviews,
    requestsSent,
    requestsCompleted,
  ] = await Promise.all([
    db.product.count({ where: { storeId: store.id } }),
    db.review.count({ where: { storeId: store.id, status: 'approved' } }),
    db.review.count({ where: { storeId: store.id, status: 'pending' } }),
    db.review.count({ where: { storeId: store.id, source: 'judgeme_import' } }),
    db.reviewNudge.count({ where: { storeId: store.id, status: 'sent' } }),
    db.reviewNudge.count({ where: { storeId: store.id, status: 'completed' } }),
  ])

  res.json({
    success: true,
    overview: {
      storeId: store.id,
      storeName: store.name,
      plan: store.plan,
      shopDomain: store.shopDomain,
      connectionStatus: store.connectionStatus,
      products,
      approvedReviews,
      pendingReviews,
      importedReviews,
      requestsSent,
      requestsCompleted,
      reviewRequestsEnabled: !!store.settings?.isEnabled,
      emailSubject: store.settings?.emailSubject || null,
      sendDelayDays: store.settings?.sendDelayDays ?? null,
      followUpDelayDays: store.settings?.followUpDelayDays ?? null,
    },
  })
})
