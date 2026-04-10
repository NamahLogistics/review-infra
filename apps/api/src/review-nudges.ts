import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { db } from './db';
import { requireUser } from './middleware/require-user';
import { logEvent } from './utils';
import { ok, fail } from './http';

export const reviewNudgesRouter = express.Router();

const createSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().email(),
  orderRef: z.string().optional(),
});

const sendSchema = z.object({
  nudgeId: z.string().min(1),
});

function getTransporter() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

reviewNudgesRouter.get('/', requireUser, async (req: any, res) => {
  const storeId = String(req.query.storeId || '');

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      userId: req.user.id,
    },
  });

  if (!store) {
    return res.status(404).json(fail('Store not found'));
  }

  const nudges = await db.reviewNudge.findMany({
    where: { storeId: store.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(ok(nudges));
});

reviewNudgesRouter.get('/analytics', requireUser, async (req: any, res) => {
  const storeId = String(req.query.storeId || '');

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      userId: req.user.id,
    },
  });

  if (!store) {
    return res.status(404).json(fail('Store not found'));
  }

  const nudges = await db.reviewNudge.findMany({
    where: { storeId: store.id },
    select: {
      status: true,
      sentAt: true,
      completedAt: true,
      resendCount: true,
      openedAt: true,
      clickedAt: true,
    },
  });

  const total = nudges.length;
  const pending = nudges.filter((n) => n.status === 'pending').length;
  const sent = nudges.filter((n) => n.status === 'sent').length;
  const completed = nudges.filter((n) => n.status === 'completed').length;
  const opened = nudges.filter((n) => !!n.openedAt).length;
  const clicked = nudges.filter((n) => !!n.clickedAt).length;
  const totalResends = nudges.reduce((sum, n) => sum + n.resendCount, 0);
  const completionRate = total ? Number(((completed / total) * 100).toFixed(1)) : 0;
  const openRate = total ? Number(((opened / total) * 100).toFixed(1)) : 0;
  const clickRate = total ? Number(((clicked / total) * 100).toFixed(1)) : 0;

  res.json(ok({
    total,
    pending,
    sent,
    completed,
    opened,
    clicked,
    totalResends,
    completionRate,
    openRate,
    clickRate,
  }));
});

reviewNudgesRouter.post('/', requireUser, async (req: any, res) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(fail('Invalid input', parsed.error));
  }

  const { storeId, productId, customerName, customerEmail, orderRef } = parsed.data;

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      userId: req.user.id,
    },
  });

  if (!store) {
    return res.status(404).json(fail('Store not found'));
  }

  const product = await db.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
  });

  if (!product) {
    return res.status(404).json(fail('Product not found'));
  }

  const nudge = await db.reviewNudge.create({
    data: {
      storeId: store.id,
      productId: product.id,
      customerName: customerName || null,
      customerEmail,
      orderRef: orderRef || null,
      status: 'pending',
    },
  });

  await logEvent({
    storeId: store.id,
    productId: product.id,
    nudgeId: nudge.id,
    type: 'nudge.created',
    payload: {
      customerEmail,
      orderRef: orderRef || null,
    },
  });

  res.json(ok(nudge));
});

reviewNudgesRouter.post('/send', requireUser, async (req: any, res) => {
  const parsed = sendSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(fail('Invalid input', parsed.error));
  }

  const { nudgeId } = parsed.data;

  const nudge = await db.reviewNudge.findFirst({
    where: {
      id: nudgeId,
      store: {
        userId: req.user.id,
      },
    },
    include: {
      store: true,
      product: true,
    },
  });

  if (!nudge) {
    return res.status(404).json(fail('Nudge not found'));
  }

  const clickUrl = `${process.env.APP_BASE_URL}/tracking/nudge/click/${nudge.id}`;
  const openUrl = `${process.env.APP_BASE_URL}/tracking/nudge/open/${nudge.id}`;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: nudge.customerEmail,
    subject: `How was your experience with ${nudge.product.name}?`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <p>Hi ${nudge.customerName || 'there'},</p>
        <p>How was your experience with <b>${nudge.product.name}</b>?</p>
        <p>Please leave a quick review here:</p>
        <p><a href="${clickUrl}">${clickUrl}</a></p>
        <img src="${openUrl}" alt="" width="1" height="1" style="display:block;border:0" />
        <p>Thank you.</p>
      </div>
    `,
  });

  const updated = await db.reviewNudge.update({
    where: { id: nudge.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
  });

  await logEvent({
    storeId: nudge.store.id,
    productId: nudge.product.id,
    nudgeId: nudge.id,
    type: 'nudge.sent',
    payload: {
      customerEmail: nudge.customerEmail,
      resendCount: updated.resendCount,
    },
  });

  res.json(ok({
    nudge: updated,
    clickUrl,
    openUrl,
  }));
});
