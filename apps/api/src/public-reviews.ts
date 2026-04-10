import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { getClientIp, logEvent, sha256 } from './utils';

export const publicReviewsRouter = express.Router();

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
      status: 'pending',
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
