'use client';

import { TopRating } from '@review-infra/widget';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Store = {
  id: string;
  name: string;
  apiKey: string;
  storeType?: 'shopify' | 'custom';
};

type Product = {
  id: string;
  name: string;
  externalId?: string | null;
};

export default function ReviewsDemoPage() {
  const [token, setToken] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('review_infra_user_token') || '';
    const s = localStorage.getItem('review_infra_store_id') || '';
    setToken(t);
    setActiveStoreId(s);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadStores(token);
  }, [token]);

  useEffect(() => {
    if (!activeStoreId || !stores.length) return;

    const store = stores.find((s) => s.id === activeStoreId);
    if (!store) return;

    localStorage.setItem('review_infra_store_id', activeStoreId);
    setApiKey(store.apiKey || '');
    loadProducts(activeStoreId, store.apiKey || '');
  }, [activeStoreId, stores]);

  const activeStore = useMemo(
    () => stores.find((store) => store.id === activeStoreId) || null,
    [stores, activeStoreId]
  );

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadStores(authToken: string) {
    const res = await fetch(`${API_BASE}/stores`, {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    const data = await safeJson(res);

    if (!res.ok || !Array.isArray(data)) {
      setStatusText('Failed to load stores.');
      return;
    }

    setStores(data);

    const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
    const nextStoreId =
      savedStoreId && data.some((s: Store) => s.id === savedStoreId)
        ? savedStoreId
        : data[0]?.id || '';

    setActiveStoreId(nextStoreId);
  }

  async function loadProducts(storeId: string, resolvedApiKey: string) {
    if (!storeId || !resolvedApiKey) {
      setProducts([]);
      setProductId('');
      return;
    }

    const res = await fetch(`${API_BASE}/store/${storeId}/products`, {
      headers: {
        'x-api-key': resolvedApiKey,
      },
    });

    const data = await safeJson(res);

    if (!res.ok || !Array.isArray(data)) {
      setProducts([]);
      setProductId('');
      setStatusText('Failed to load products for this store.');
      return;
    }

    setProducts(data);
    setStatusText('');

    const firstProduct = data[0];
    if (!firstProduct) {
      setProductId('');
      return;
    }

    setProductId(firstProduct.externalId || firstProduct.id);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Reviews widget demo</div>
              <div style={{ marginTop: 8, opacity: 0.65 }}>
                Real store-linked widget preview using your selected workspace.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/dashboard"
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #ddd',
                  textDecoration: 'none',
                  color: '#111',
                  fontWeight: 700,
                  background: '#fff',
                }}
              >
                Dashboard
              </Link>
              {activeStoreId ? (
                <Link
                  href={`/stores/${activeStoreId}/setup`}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #ddd',
                    textDecoration: 'none',
                    color: '#111',
                    fontWeight: 700,
                    background: '#fff',
                  }}
                >
                  Store setup
                </Link>
              ) : null}
            </div>
          </div>

          {statusText ? (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 14,
              }}
            >
              {statusText}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Store</label>
              <select
                value={activeStoreId}
                onChange={(e) => setActiveStoreId(e.target.value)}
                style={{ width: '100%', padding: 14, border: '1px solid #ddd', borderRadius: 14, background: '#fff' }}
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.storeType ? `(${store.storeType})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                style={{ width: '100%', padding: 14, border: '1px solid #ddd', borderRadius: 14, background: '#fff' }}
                disabled={!products.length}
              >
                <option value="">{products.length ? 'Select product' : 'No products found'}</option>
                {products.map((product) => {
                  const value = product.externalId || product.id;
                  return (
                    <option key={product.id} value={value}>
                      {product.name}{product.externalId ? ` — ${product.externalId}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                style={{ width: '100%', padding: 14, border: '1px solid #ddd', borderRadius: 14 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 13, opacity: 0.7 }}>
            Active store: <b>{activeStore?.name || '-'}</b> · Products: <b>{products.length}</b>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          {apiKey && productId ? (
            <TopRating productId={productId} apiBaseUrl={API_BASE} apiKey={apiKey} />
          ) : (
            <div style={{ opacity: 0.7 }}>
              Select a store and product first to preview the widget.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
