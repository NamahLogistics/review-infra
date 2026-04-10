import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { db } from './db';
import { logEvent } from './utils';

export const autoNudgesRouter = express.Router();

const ingestSchema = z.object({
  apiKey: z.string().min(10),
  externalOrderId: z.string().optional(),
  orderRef: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      productName: z.string().optional(),
    })
  ).min(1),
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
    auth: { user, pass },
  });
}

function getWorkerToken(req: express.Request) {
  return String(req.headers['x-worker-token'] || '');
}

autoNudgesRouter.post('/ingest-order', async (req, res) => {
  const parsed = ingestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { apiKey, externalOrderId, orderRef, customerName, customerEmail, items } = parsed.data;

  const store = await db.store.findUnique({
    where: { apiKey },
  });

  if (!store) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const delayHours = Number(process.env.AUTO_NUDGE_DELAY_HOURS || 24);
  const sendAfter = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  const createdOrders: any[] = [];
  const createdNudges: any[] = [];

  for (const item of items) {
    const product = await db.product.findFirst({
      where: {
        storeId: store.id,
        OR: [
          { id: item.productId },
          { externalId: item.productId },
        ],
      },
    });

    if (!product) {
      continue;
    }

    const order = await db.reviewOrder.upsert({
      where: {
        storeId_externalOrderId_productId: {
          storeId: store.id,
          externalOrderId: externalOrderId || `manual:${orderRef || customerEmail}:${product.id}`,
          productId: product.id,
        },
      },
      update: {
        customerName: customerName || null,
        customerEmail,
        orderRef: orderRef || null,
      },
      create: {
        storeId: store.id,
        productId: product.id,
        externalOrderId: externalOrderId || `manual:${orderRef || customerEmail}:${product.id}`,
        customerName: customerName || null,
        customerEmail,
        orderRef: orderRef || null,
      },
    });

    createdOrders.push(order);

    const existingPending = await db.reviewNudge.findFirst({
      where: {
        storeId: store.id,
        productId: product.id,
        customerEmail,
        status: {
          in: ['pending', 'sent'],
        },
      },
    });

    if (!existingPending) {
      const nudge = await db.reviewNudge.create({
        data: {
          storeId: store.id,
          productId: product.id,
          customerName: customerName || null,
          customerEmail,
          orderRef: orderRef || null,
          status: 'pending',
          sendAfter,
        },
      });

      createdNudges.push(nudge);

      await logEvent({
        storeId: store.id,
        productId: product.id,
        nudgeId: nudge.id,
        type: 'nudge.auto_created',
        payload: {
          customerEmail,
          orderRef: orderRef || null,
          sendAfter,
        },
      });
    }
  }

  res.json({
    success: true,
    orders: createdOrders.length,
    nudges: createdNudges.length,
    createdOrders,
    createdNudges,
  });
});

autoNudgesRouter.post('/run', async (req, res) => {
  const workerToken = process.env.AUTO_NUDGE_WORKER_TOKEN || '';
  const incomingToken = getWorkerToken(req);

  if (!workerToken || incomingToken !== workerToken) {
    return res.status(401).json({ error: 'Invalid worker token' });
  }

  const now = new Date();

  const pendingNudges = await db.reviewNudge.findMany({
    where: {
      status: 'pending',
      OR: [
        { sendAfter: null },
        { sendAfter: { lte: now } },
      ],
    },
    include: {
      store: true,
      product: true,
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  const resendHours = Number(process.env.AUTO_NUDGE_RESEND_AFTER_HOURS || 72);
  const maxResends = Number(process.env.AUTO_NUDGE_MAX_RESENDS || 2);

  const resendNudges = await db.reviewNudge.findMany({
    where: {
      status: 'sent',
      resendCount: {
        lt: maxResends,
      },
      sentAt: {
        lte: new Date(Date.now() - resendHours * 60 * 60 * 1000),
      },
      completedAt: null,
    },
    include: {
      store: true,
      product: true,
    },
    take: 50,
    orderBy: { sentAt: 'asc' },
  });

  const nudges = [...pendingNudges, ...resendNudges];

  if (!nudges.length) {
    return res.json({
      success: true,
      processed: 0,
      sent: [],
      failed: [],
    });
  }

  const transporter = getTransporter();

  const sent: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const nudge of nudges) {
    try {
      const submitUrl =
        `${process.env.APP_BASE_URL}/submit-review?` +
        `apiKey=${encodeURIComponent(nudge.store.apiKey)}` +
        `&productId=${encodeURIComponent(nudge.product.externalId || nudge.product.id)}` +
        `&authorName=${encodeURIComponent(nudge.customerName || '')}` +
        `&authorEmail=${encodeURIComponent(nudge.customerEmail)}`;

      const isResend = nudge.status === 'sent';

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: nudge.customerEmail,
        subject: isResend
          ? `Reminder: review ${nudge.product.name}`
          : `How was your experience with ${nudge.product.name}?`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <p>Hi ${nudge.customerName || 'there'},</p>
            <p>${isResend ? 'Just a quick reminder' : 'How was your experience'} with <b>${nudge.product.name}</b>?</p>
            <p>Please leave a quick review here:</p>
            <p><a href="${submitUrl}">${submitUrl}</a></p>
            <p>Thank you.</p>
          </div>
        `,
      });

      const updated = await db.reviewNudge.update({
        where: { id: nudge.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          resendCount: isResend ? { increment: 1 } : undefined,
          lastResendAt: isResend ? new Date() : nudge.lastResendAt,
        },
      });

      await db.reviewOrder.updateMany({
        where: {
          storeId: nudge.storeId,
          productId: nudge.productId,
          customerEmail: nudge.customerEmail,
          nudgedAt: null,
        },
        data: {
          nudgedAt: new Date(),
        },
      });

      await logEvent({
        storeId: nudge.store.id,
        productId: nudge.product.id,
        nudgeId: nudge.id,
        type: isResend ? 'nudge.resent' : 'nudge.sent',
        payload: {
          customerEmail: nudge.customerEmail,
          resendCount: updated.resendCount,
        },
      });

      sent.push(nudge.id);
    } catch (error: any) {
      failed.push({
        id: nudge.id,
        error: error?.message || 'Unknown error',
      });

      await logEvent({
        storeId: nudge.store.id,
        productId: nudge.product.id,
        nudgeId: nudge.id,
        type: 'nudge.send_failed',
        payload: {
          error: error?.message || 'Unknown error',
        },
      });
    }
  }

  res.json({
    success: true,
    processed: nudges.length,
    sent,
    failed,
  });
});
