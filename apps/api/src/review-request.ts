import express from 'express'
import { db } from './db'

export const reviewRequestRouter = express.Router()

reviewRequestRouter.get('/:nudgeId', async (req, res) => {
  try {
    const nudgeId = String(req.params.nudgeId || '').trim()

    if (!nudgeId) {
      return res.status(400).json({ error: 'nudgeId required' })
    }

    const nudge = await db.reviewNudge.findUnique({
      where: { id: nudgeId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            apiKey: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            externalId: true,
          },
        },
      },
    })

    if (!nudge) {
      return res.status(404).json({ error: 'Review request not found' })
    }

    return res.json({
      success: true,
      request: {
        nudgeId: nudge.id,
        storeName: nudge.store.name,
        apiKey: nudge.store.apiKey,
        productId: nudge.product.externalId || nudge.product.id,
        productName: nudge.product.name,
        authorName: nudge.customerName || '',
        authorEmail: nudge.customerEmail || '',
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to load review request' })
  }
})
