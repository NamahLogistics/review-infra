import express from 'express'
import { db } from './db'
import { requireUser } from './middleware/require-user'

export const importJudgeMeRouter = express.Router()

async function fetchJudgeMeReviews(params: {
  shopDomain: string
  apiToken: string
  page: number
  perPage: number
}) {
  const url = new URL('https://judge.me/api/v1/reviews')
  url.searchParams.set('shop_domain', params.shopDomain)
  url.searchParams.set('api_token', params.apiToken)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('per_page', String(params.perPage))

  const res = await fetch(url.toString())
  const data: any = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.errors ||
      data?.message ||
      `Judge.me request failed with HTTP ${res.status}`
    )
  }

  return data
}

function normalizeRating(value: any) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 5
  return Math.max(1, Math.min(5, Math.round(n)))
}

function getReviewBody(review: any) {
  return String(
    review.body ||
    review.content ||
    review.review ||
    review.text ||
    ''
  ).trim()
}

function getReviewTitle(review: any) {
  const value = String(review.title || '').trim()
  return value || null
}

function getReviewerName(review: any) {
  return String(
    review.reviewer?.name ||
    review.reviewer_name ||
    review.name ||
    'Anonymous'
  ).trim()
}

function getReviewerEmail(review: any) {
  const value = String(
    review.reviewer?.email ||
    review.reviewer_email ||
    review.email ||
    ''
  ).trim()
  return value || null
}

function getExternalProductId(review: any) {
  const raw =
    review.product_external_id ??
    review.external_id ??
    review.shopify_product_id ??
    review.product_id ??
    review.id_product

  if (raw === undefined || raw === null || raw === '') return null
  return String(raw)
}

function getProductTitle(review: any) {
  return String(
    review.product_title ||
    review.title_product ||
    review.product_name ||
    review.product?.title ||
    'Imported product'
  ).trim()
}

function getCreatedAt(review: any) {
  const raw =
    review.created_at ||
    review.createdAt ||
    review.published_at ||
    review.updated_at

  if (!raw) return new Date()
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

importJudgeMeRouter.post('/judgeme', requireUser, async (req: any, res) => {
  try {
    const { storeId } = req.body || {}

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' })
    }

    const store = await db.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.id,
      },
    })

    if (!store) {
      return res.status(404).json({ error: 'Store not found' })
    }

    if (!store.shopDomain) {
      return res.status(400).json({ error: 'Connect Shopify first' })
    }

    if (!store.judgeMeToken) {
      return res.status(400).json({ error: 'Judge.me not connected' })
    }

    const perPage = 100
    let page = 1
    let imported = 0
    let skipped = 0
    let createdProducts = 0

    for (;;) {
      const data = await fetchJudgeMeReviews({
        shopDomain: store.shopDomain,
        apiToken: store.judgeMeToken,
        page,
        perPage,
      })

      const reviews = Array.isArray(data?.reviews) ? data.reviews : []
      if (!reviews.length) break

      for (const review of reviews) {
        const body = getReviewBody(review)
        if (!body) {
          skipped += 1
          continue
        }

        const externalId = getExternalProductId(review)
        const productTitle = getProductTitle(review)

        let product = null

        if (externalId) {
          product = await db.product.findFirst({
            where: {
              storeId: store.id,
              OR: [
                { externalId },
                { id: externalId },
              ],
            },
          })
        }

        if (!product) {
          product = await db.product.findFirst({
            where: {
              storeId: store.id,
              name: productTitle,
            },
          })
        }

        if (!product) {
          product = await db.product.create({
            data: {
              storeId: store.id,
              name: productTitle,
              externalId: externalId || undefined,
            },
          })
          createdProducts += 1
        }

        const authorName = getReviewerName(review)
        const authorEmail = getReviewerEmail(review)
        const createdAt = getCreatedAt(review)
        const rating = normalizeRating(review.rating)

        const existing = await db.review.findFirst({
          where: {
            storeId: store.id,
            productId: product.id,
            source: 'judgeme_import',
            text: body,
            authorName,
          },
        })

        if (existing) {
          skipped += 1
          continue
        }

        await db.review.create({
          data: {
            storeId: store.id,
            productId: product.id,
            rating,
            title: getReviewTitle(review),
            text: body,
            authorName,
            authorEmail,
            source: 'judgeme_import',
            status: 'approved',
            verified: false,
            createdAt,
          },
        })

        imported += 1
      }

      if (reviews.length < perPage) break
      page += 1
      if (page > 50) break
    }

    return res.json({
      success: true,
      imported,
      skipped,
      createdProducts,
    })
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Judge.me import failed' })
  }
})
