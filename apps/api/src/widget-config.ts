import express from 'express'
import { db } from './db'

export const widgetConfigRouter = express.Router()

widgetConfigRouter.get('/:storeId', async (req, res) => {
  const storeId = String(req.params.storeId || '').trim()

  if (!storeId) {
    return res.status(400).json({ error: 'storeId required' })
  }

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      apiKey: true,
      shopDomain: true,
      connectionStatus: true,
      name: true,
      accessToken: true,
    },
  })

  if (!store) {
    return res.status(404).json({ error: 'Store not found' })
  }

  if (store.connectionStatus !== 'connected' || !store.shopDomain || !store.accessToken) {
    return res.json({
      disabled: true,
      storeId: store.id,
      connectionStatus: store.connectionStatus,
    })
  }

  res.json({
    disabled: false,
    storeId: store.id,
    apiKey: store.apiKey,
    shopDomain: store.shopDomain,
    connectionStatus: store.connectionStatus,
    name: store.name,
  })
})
