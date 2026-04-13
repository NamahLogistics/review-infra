import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { getClientIp, logEvent, sha256 } from './utils';

export const publicReviewsRouter = express.Router();

function normalizeModerationText(value?: string | null) {
  return String(value || '').toLowerCase();
}

function containsAbuseForModeration(text?: string | null) {
  const normalized = normalizeModerationText(text);
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

function isSpamForModeration(text?: string | null) {
  const normalized = normalizeModerationText(text);
  if (!normalized || normalized.trim().length < 5) return true;
  if (normalized.includes('http://') || normalized.includes('https://') || normalized.includes('www.')) return true;
  const repeatedChars = /(.)\1{7,}/.test(normalized);
  return repeatedChars;
}

function getInitialModerationStatus(rating: number, text?: string | null) {
  if (rating >= 4 && !containsAbuseForModeration(text) && !isSpamForModeration(text)) {
    return 'approved';
  }
  return 'pending';
}


const submitSchema = z.object({
  apiKey: z.string().min(10),
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  text: z.string().min(3),
  authorName: z.string().optional(),
  authorEmail: z.string().email().optional(),
});

publicReviewsRouter.post('/submit', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { apiKey, productId, rating, title, text, authorName, authorEmail } = parsed.data;

  const store = await db.store.findUnique({
    where: { apiKey },
  });

  if (!store) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const product = await db.product.findFirst({
    where: {
      storeId: store.id,
      OR: [
        { id: productId },
        { externalId: productId },
      ],
    },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  if (authorEmail) {
    const perEmailLimit = Number(process.env.MAX_PUBLIC_REVIEWS_PER_EMAIL_PER_DAY || 3);
    const countByEmail = await db.review.count({
      where: {
        storeId: store.id,
        authorEmail,
        createdAt: {
          gte: dayStart,
        },
      },
    });

    if (countByEmail >= perEmailLimit) {
      return res.status(429).json({ error: 'Daily review limit reached for this email' });
    }
  }

  const ip = getClientIp(req);
  const ipHash = ip ? sha256(ip) : null;

  if (ipHash) {
    const perIpLimit = Number(process.env.MAX_PUBLIC_REVIEWS_PER_IP_PER_DAY || 10);
    const countByIp = await db.review.count({
      where: {
        storeId: store.id,
        ipHash,
        createdAt: {
          gte: dayStart,
        },
      },
    });

    if (countByIp >= perIpLimit) {
      return res.status(429).json({ error: 'Daily review limit reached for this IP' });
    }
  }

  const review = await db.review.create({
    data: {
      storeId: store.id,
      productId: product.id,
      rating,
      title: title || null,
      text,
      authorName: authorName || 'Anonymous',
      authorEmail: authorEmail || null,
      status: getInitialModerationStatus(rating, text),
      verified: false,
      source: 'public_form',
      ipHash,
    },
  });

  await logEvent({
    storeId: store.id,
    productId: product.id,
    reviewId: review.id,
    type: 'review.submitted',
    payload: {
      source: 'public_form',
      authorEmail: authorEmail || null,
      rating,
    },
  });

  if (authorEmail) {
    await db.reviewNudge.updateMany({
      where: {
        storeId: store.id,
        productId: product.id,
        customerEmail: authorEmail,
        status: {
          in: ['pending', 'sent'],
        },
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    const completedNudges = await db.reviewNudge.findMany({
      where: {
        storeId: store.id,
        productId: product.id,
        customerEmail: authorEmail,
        status: 'completed',
        completedAt: {
          gte: dayStart,
        },
      },
      select: { id: true },
    });

    for (const nudge of completedNudges) {
      await logEvent({
        storeId: store.id,
        productId: product.id,
        reviewId: review.id,
        nudgeId: nudge.id,
        type: 'nudge.completed',
        payload: {
          authorEmail,
        },
      });
    }
  }

  res.json({
    success: true,
    review: {
      id: review.id,
      status: review.status,
    },
  });
});
