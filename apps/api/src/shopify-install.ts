import express from 'express'
import { db } from './db'
import { ensureValidShopifyAccessToken } from './shopify'

export const shopifyInstallRouter = express.Router()

function widgetSrc(storeId: string) {
  const base = process.env.WIDGET_BASE_URL || process.env.APP_BASE_URL
  return `${base}/embed/widget.js?storeId=${encodeURIComponent(storeId)}`
}

async function getStoreOrThrow(storeId: string) {
  const store = await db.store.findUnique({
    where: { id: storeId },
  })

  if (!store) throw new Error('Store not found')
  if (!store.shopDomain) throw new Error('Store not connected')

  return store
}

async function getValidShopifyConnection(storeId: string) {
  const valid = await ensureValidShopifyAccessToken(storeId)
  const store = await getStoreOrThrow(storeId)

  return {
    store,
    shopDomain: valid.shopDomain,
    accessToken: valid.accessToken,
  }
}

async function listScriptTags(shopDomain: string, accessToken: string) {
  const resp = await fetch(`https://${shopDomain}/admin/api/2025-01/script_tags.json`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
  })

  const json: any = await resp.json().catch(() => null)

  if (!resp.ok) {
    throw new Error(json?.errors || json?.error || 'Failed to list script tags')
  }

  return Array.isArray(json?.script_tags) ? json.script_tags : []
}

function isReviewInfraTag(tag: any) {
  const src = String(tag?.src || '')
  return src.includes('/embed/widget.js')
}

async function removeExistingWidgetTags(shopDomain: string, accessToken: string) {
  const existingTags = await listScriptTags(shopDomain, accessToken)
  const tagsToDelete = existingTags.filter(isReviewInfraTag)

  for (const tag of tagsToDelete) {
    const resp = await fetch(`https://${shopDomain}/admin/api/2025-01/script_tags/${tag.id}.json`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    })

    if (!resp.ok) {
      const json: any = await resp.json().catch(() => null)
      throw new Error(json?.errors || `Failed to delete script tag ${tag.id}`)
    }
  }

  return tagsToDelete
}

async function installWidgetForStore(storeId: string) {
  const { store, shopDomain, accessToken } = await getValidShopifyConnection(storeId)
  const removed = await removeExistingWidgetTags(shopDomain, accessToken)
  const src = widgetSrc(store.id)

  const resp = await fetch(`https://${shopDomain}/admin/api/2025-01/script_tags.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      script_tag: {
        event: 'onload',
        src,
      },
    }),
  })

  const json: any = await resp.json().catch(() => null)

  if (!resp.ok) {
    throw new Error(json?.errors || json?.error || 'Failed to install widget')
  }

  return {
    success: true,
    scriptTag: json?.script_tag || null,
    removed: removed.map((t: any) => ({ id: t.id, src: t.src })),
  }
}

function isBrokenConnectionError(message: string) {
  const msg = String(message || '').toLowerCase()

  return (
    msg.includes('refresh token expired') ||
    msg.includes('not connected') ||
    msg.includes('invalid access token') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('expired')
  )
}

shopifyInstallRouter.post('/install-widget', async (req, res) => {
  try {
    const { storeId } = req.body || {}
    if (!storeId) return res.status(400).json({ error: 'storeId required' })

    const result = await installWidgetForStore(storeId)
    return res.json(result)
  } catch (error: any) {
    const message = error?.message || 'Failed to install widget'

    if (isBrokenConnectionError(message)) {
      return res.status(400).json({
        error: 'Shopify connection expired. Reconnect required.',
        connectionBroken: true,
      })
    }

    return res.status(400).json({ error: message, connectionBroken: false })
  }
})

shopifyInstallRouter.post('/remove-widget', async (req, res) => {
  try {
    const { storeId } = req.body || {}
    if (!storeId) return res.status(400).json({ error: 'storeId required' })

    const { shopDomain, accessToken } = await getValidShopifyConnection(storeId)
    const removed = await removeExistingWidgetTags(shopDomain, accessToken)

    return res.json({
      success: true,
      removed: removed.map((t: any) => ({ id: t.id, src: t.src })),
    })
  } catch (error: any) {
    const message = error?.message || 'Failed to remove widget'

    if (isBrokenConnectionError(message)) {
      return res.status(400).json({
        error: 'Shopify connection expired. Reconnect required.',
        connectionBroken: true,
      })
    }

    return res.status(400).json({ error: message, connectionBroken: false })
  }
})

shopifyInstallRouter.post('/reinstall-widget', async (req, res) => {
  try {
    const { storeId } = req.body || {}
    if (!storeId) return res.status(400).json({ error: 'storeId required' })

    const result = await installWidgetForStore(storeId)
    return res.json(result)
  } catch (error: any) {
    const message = error?.message || 'Failed to reinstall widget'

    if (isBrokenConnectionError(message)) {
      return res.status(400).json({
        error: 'Shopify connection expired. Reconnect required.',
        connectionBroken: true,
      })
    }

    return res.status(400).json({ error: message, connectionBroken: false })
  }
})

shopifyInstallRouter.get('/widget-status/:storeId', async (req, res) => {
  try {
    const storeId = String(req.params.storeId || '')
    if (!storeId) return res.status(400).json({ error: 'storeId required' })

    const { shopDomain, accessToken } = await getValidShopifyConnection(storeId)
    const tags = await listScriptTags(shopDomain, accessToken)
    const widgetTags = tags.filter(isReviewInfraTag)

    return res.json({
      success: true,
      installed: widgetTags.length > 0,
      connectionBroken: false,
      count: widgetTags.length,
      scriptTags: widgetTags.map((t: any) => ({
        id: t.id,
        src: t.src,
        created_at: t.created_at || null,
        updated_at: t.updated_at || null,
      })),
    })
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch widget status'

    if (isBrokenConnectionError(message)) {
      return res.json({
        success: false,
        installed: false,
        connectionBroken: true,
        error: 'Shopify connection expired. Reconnect required.',
      })
    }

    return res.status(400).json({
      error: message,
      connectionBroken: false,
    })
  }
})
