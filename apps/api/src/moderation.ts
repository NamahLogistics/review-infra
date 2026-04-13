import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { requireUser } from './middleware/require-user';

export const moderationRouter = express.Router();

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['pending', 'approved', 'rejected']),
});

function normalizeText(value?: string | null) {
  return String(value || '').toLowerCase();
}

function containsAbuse(text?: string | null) {
  const normalized = normalizeText(text);
  const badWords = [
    'fuck',
    'shit',
    'bitch',
    'asshole',
    'bastard',
    'fraud',
    'scam',
    'idiot',
    'stupid',
  ];
  return badWords.some((word) => normalized.includes(word));
}

function isSpam(text?: string | null) {
  const normalized = normalizeText(text);
  if (!normalized || normalized.trim().length < 5) return true;
  if (normalized.includes('http://') || normalized.includes('https://') || normalized.includes('www.')) return true;
  const repeatedChars = /(.)\1{7,}/.test(normalized);
  return repeatedChars;
}

function derivePriority(review: any) {
  if (review.status === 'pending' && (review.rating <= 2 || containsAbuse(review.text) || isSpam(review.text))) {
    return 'high';
  }
  if (review.status === 'pending' && review.rating === 3) {
    return 'medium';
  }
  return 'low';
}

function deriveTags(review: any) {
  const text = normalizeText(review.text);
  const tags: string[] = [];

  if (review.rating <= 2) tags.push('negative');
  if (containsAbuse(review.text)) tags.push('abuse');
  if (isSpam(review.text)) tags.push('spam');
  if (text.includes('late') || text.includes('delivery') || text.includes('shipping')) tags.push('delivery');
  if (text.includes('size') || text.includes('fit') || text.includes('small') || text.includes('large')) tags.push('sizing');
  if (text.includes('quality') || text.includes('broken') || text.includes('cheap')) tags.push('quality');

  return Array.from(new Set(tags));
}

moderationRouter.get('/store/:storeId/reviews', requireUser, async (req: any, res) => {
  const storeId = String(req.params.storeId || '');
  const status = String(req.query.status || 'pending');
  const attentionOnly = String(req.query.attentionOnly || 'false') === 'true';

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      userId: req.user.id,
    },
  });

  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const where: any = {
    storeId: store.id,
  };

  if (['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status;
  }

  const reviews = await db.review.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  const enriched = reviews.map((review) => {
    const priority = derivePriority(review);
    const tags = deriveTags(review);
    return {
      ...review,
      priority,
      tags,
      needsAttention:
        review.status === 'pending' &&
        (priority === 'high' || priority === 'medium'),
    };
  });

  const filtered = attentionOnly
    ? enriched.filter((review) => review.needsAttention)
    : enriched;

  filtered.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return order[a.priority] - order[b.priority];
  });

  return res.json({
    success: true,
    reviews: filtered,
    counts: {
      pending: enriched.filter((r) => r.status === 'pending').length,
      approved: enriched.filter((r) => r.status === 'approved').length,
      rejected: enriched.filter((r) => r.status === 'rejected').length,
      needsAttention: enriched.filter((r) => r.needsAttention).length,
    },
  });
});

moderationRouter.patch('/reviews/:id/status', requireUser, async (req: any, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await db.review.findFirst({
    where: {
      id: req.params.id,
      store: {
        userId: req.user.id,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const updated = await db.review.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return res.json({
    success: true,
    review: {
      ...updated,
      priority: derivePriority(updated),
      tags: deriveTags(updated),
      needsAttention:
        updated.status === 'pending' &&
        (derivePriority(updated) === 'high' || derivePriority(updated) === 'medium'),
    },
  });
});

moderationRouter.patch('/reviews/bulk-status', requireUser, async (req: any, res) => {
  const parsed = bulkUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const accessible = await db.review.findMany({
    where: {
      id: { in: parsed.data.ids },
      store: {
        userId: req.user.id,
      },
    },
    select: { id: true },
  });

  const ids = accessible.map((r) => r.id);

  if (!ids.length) {
    return res.status(404).json({ error: 'No matching reviews found' });
  }

  const result = await db.review.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      status: parsed.data.status,
    },
  });

  return res.json({
    success: true,
    updated: result.count,
    ids,
    status: parsed.data.status,
  });
});
