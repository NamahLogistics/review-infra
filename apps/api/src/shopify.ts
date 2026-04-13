import express from 'express';
import crypto from 'crypto';
import { db } from './db';

export const shopifyRouter = express.Router();

function normalizeShop(value: string) {
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (!trimmed) return '';
  return trimmed.endsWith('.myshopify.com') ? trimmed : `${trimmed}.myshopify.com`;
}

function addSeconds(seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) return null;
  return new Date(Date.now() + seconds * 1000);
}

function willExpireSoon(value?: Date | string | null) {
  if (!value) return true;
  return new Date(value).getTime() - Date.now() < 5 * 60 * 1000;
}

async function postTokenRequest(shop: string, params: Record<string, string>) {
  const body = new URLSearchParams(params);

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  const json: any = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.errors ||
      json?.error_description ||
      json?.error ||
      `Shopify token request failed with HTTP ${response.status}`;

    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return json;
}

async function persistShopifyTokens(storeId: string, shop: string, tokenData: any) {
  if (!tokenData?.access_token) {
    throw new Error('Shopify did not return an access token');
  }

  return db.store.update({
    where: { id: storeId },
    data: {
      shopDomain: shop,
      accessToken: tokenData.access_token,
      shopifyRefreshToken: tokenData.refresh_token ?? null,
      shopifyAccessTokenExpiresAt: addSeconds(tokenData.expires_in),
      shopifyRefreshTokenExpiresAt: addSeconds(tokenData.refresh_token_expires_in),
      connectionStatus: 'connected',
      shopifyConnectedAt: new Date(),
      shopifyUninstalledAt: null,
    },
  });
}

async function migrateLegacyOfflineToken(store: any) {
  if (!store?.id || !store?.shopDomain || !store?.accessToken) {
    throw new Error('Store is missing legacy Shopify token data');
  }

  const tokenData = await postTokenRequest(store.shopDomain, {
    client_id: process.env.SHOPIFY_CLIENT_ID || '',
    client_secret: process.env.SHOPIFY_CLIENT_SECRET || '',
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token: store.accessToken,
    subject_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    expiring: '1',
  });

  return persistShopifyTokens(store.id, store.shopDomain, tokenData);
}

async function refreshExpiringOfflineToken(store: any) {
  if (!store?.id || !store?.shopDomain || !store?.shopifyRefreshToken) {
    throw new Error('Store is missing Shopify refresh token');
  }

  const tokenData = await postTokenRequest(store.shopDomain, {
    client_id: process.env.SHOPIFY_CLIENT_ID || '',
    client_secret: process.env.SHOPIFY_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
    refresh_token: store.shopifyRefreshToken,
  });

  return persistShopifyTokens(store.id, store.shopDomain, tokenData);
}

export async function ensureValidShopifyAccessToken(storeId: string) {
  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  if (store.connectionStatus !== 'connected' || !store.shopDomain) {
    throw new Error('Store not connected to Shopify');
  }

  if (store.shopifyRefreshToken) {
    if (
      store.shopifyRefreshTokenExpiresAt &&
      new Date(store.shopifyRefreshTokenExpiresAt).getTime() <= Date.now()
    ) {
      throw new Error('Shopify refresh token expired. Reconnect this store.');
    }

    if (!store.accessToken || willExpireSoon(store.shopifyAccessTokenExpiresAt)) {
      const refreshed = await refreshExpiringOfflineToken(store);
      return {
        shopDomain: refreshed.shopDomain!,
        accessToken: refreshed.accessToken!,
      };
    }

    return {
      shopDomain: store.shopDomain,
      accessToken: store.accessToken,
    };
  }

  if (store.accessToken) {
    const migrated = await migrateLegacyOfflineToken(store);
    return {
      shopDomain: migrated.shopDomain!,
      accessToken: migrated.accessToken!,
    };
  }

  throw new Error('Store not connected to Shopify');
}

async function syncProducts(shop: string, accessToken: string, storeId: string) {
  const query = `
    query Products {
      products(first: 50) {
        nodes {
          id
          legacyResourceId
          title
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query }),
  });

  const json: any = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof json?.errors === 'string'
        ? json.errors
        : `Shopify sync failed with HTTP ${response.status}`
    );
  }

  if (json?.errors) {
    throw new Error(
      typeof json.errors === 'string'
        ? json.errors
        : JSON.stringify(json.errors)
    );
  }

  const products = json?.data?.products?.nodes || [];

  for (const product of products) {
    await db.product.upsert({
      where: { storeId_externalId: { storeId, externalId: String(product.legacyResourceId || product.id) } },
      update: {
        name: product.title,
        externalId: String(product.legacyResourceId || product.id),
      },
      create: {
        name: product.title,
        externalId: String(product.legacyResourceId || product.id),
        storeId,
      },
    });
  }

  return products.length;
}

shopifyRouter.get('/auth/start', async (req, res) => {
  const shop = normalizeShop(String(req.query.shop || ''));
  const storeId = String(req.query.storeId || '').trim();

  if (!shop) return res.status(400).send('Missing shop');
  if (!storeId) return res.status(400).send('Missing storeId');

  const targetStore = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!targetStore) {
    return res.status(404).send('Store workspace not found');
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID || '';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI || '';
  const scopes = 'read_products,write_script_tags';

  if (!clientId || !redirectUri) {
    return res.status(500).send('Missing Shopify OAuth configuration');
  }

  const statePayload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString('hex'),
    storeId,
  });

  const state = Buffer.from(statePayload).toString('base64url');

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  res.redirect(installUrl);
});

shopifyRouter.get('/auth/callback', async (req, res) => {
  const shop = normalizeShop(String(req.query.shop || ''));
  const code = String(req.query.code || '').trim();
  const state = String(req.query.state || '').trim();

  if (!shop || !code || !state) {
    return res.status(400).send('Missing shop, code, or state');
  }

  let storeId = '';

  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    storeId = String(decoded?.storeId || '');
  } catch {
    return res.status(400).send('Invalid state');
  }

  if (!storeId) {
    return res.status(400).send('Missing storeId in state');
  }

  const targetStore = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!targetStore) {
    return res.status(404).send('Store workspace not found');
  }

  const conflictingStore = await db.store.findUnique({
    where: { shopDomain: shop },
  });

  if (conflictingStore && conflictingStore.id !== targetStore.id) {
    return res.redirect(
      `${process.env.APP_BASE_URL}/dashboard?storeId=${encodeURIComponent(targetStore.id)}&error=${encodeURIComponent('This Shopify shop is already connected to another store workspace.')}`
    );
  }

  try {
    const tokenData = await postTokenRequest(shop, {
      client_id: process.env.SHOPIFY_CLIENT_ID || '',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET || '',
      code,
      expiring: '1',
    });

    const finalStore = await persistShopifyTokens(targetStore.id, shop, tokenData);
    const valid = await ensureValidShopifyAccessToken(finalStore.id);
    await syncProducts(valid.shopDomain, valid.accessToken, finalStore.id);

    return res.redirect(
      `${process.env.APP_BASE_URL}/dashboard?storeId=${encodeURIComponent(finalStore.id)}&connected=1`
    );
  } catch (error: any) {
    return res.redirect(
      `${process.env.APP_BASE_URL}/dashboard?storeId=${encodeURIComponent(targetStore.id)}&error=${encodeURIComponent(error?.message || 'Shopify connection failed')}`
    );
  }
});

shopifyRouter.post('/sync-products', async (req, res) => {
  const { storeId } = req.body || {};

  if (!storeId) {
    return res.status(400).json({ error: 'storeId required' });
  }

  try {
    const valid = await ensureValidShopifyAccessToken(storeId);
    const count = await syncProducts(valid.shopDomain, valid.accessToken, storeId);
    return res.json({ success: true, synced: count });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Shopify sync failed' });
  }
});
