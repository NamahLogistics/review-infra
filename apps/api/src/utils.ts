import crypto from 'crypto';
import { db } from './db';

export function getClientIp(req: any) {
  const xf = String(req.headers['x-forwarded-for'] || '');
  if (xf) return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function logEvent(input: {
  storeId: string;
  productId?: string | null;
  reviewId?: string | null;
  nudgeId?: string | null;
  type: string;
  payload: any;
}) {
  await db.reviewEvent.create({
    data: {
      storeId: input.storeId,
      productId: input.productId || null,
      reviewId: input.reviewId || null,
      nudgeId: input.nudgeId || null,
      type: input.type,
      payload: JSON.stringify(input.payload ?? {}),
    },
  });
}
