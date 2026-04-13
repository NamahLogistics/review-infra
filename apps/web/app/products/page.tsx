'use client';

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

export default function ProductsPage() {
  const [token, setToken] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [externalId, setExternalId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');

  const activeStore = useMemo(
    () => stores.find((store) => store.id === storeId) || null,
    [stores, storeId]
  );

  useEffect(() => {
    const savedToken = localStorage.getItem('review_infra_user_token') || '';
    const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
    setToken(savedToken);
    setStoreId(savedStoreId);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadStores(token);
  }, [token]);

  useEffect(() => {
    if (!activeStore?.id || !activeStore.apiKey) {
      setProducts([]);
      return;
    }

    localStorage.setItem('review_infra_store_id', activeStore.id);
    localStorage.setItem('review_infra_api_key', activeStore.apiKey);
    loadProducts(activeStore.id, activeStore.apiKey);
  }, [activeStore]);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadStores(authToken: string) {
    setLoading(true);
    setStatusText('');

    try {
      const res = await fetch(`${API_BASE}/stores`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const data = await safeJson(res);

      if (!res.ok || !Array.isArray(data)) {
        setStatusText('Failed to load stores.');
        setStatusTone('error');
        setStores([]);
        return;
      }

      setStores(data);

      const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
      const nextStoreId =
        savedStoreId && data.some((store: Store) => store.id === savedStoreId)
          ? savedStoreId
          : data[0]?.id || '';

      setStoreId(nextStoreId);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(resolvedStoreId: string, apiKey: string) {
    setLoading(true);
    setStatusText('');

    try {
      const res = await fetch(`${API_BASE}/store/${resolvedStoreId}/products`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await safeJson(res);

      if (!res.ok || !Array.isArray(data)) {
        setProducts([]);
        setStatusText('Failed to load products.');
        setStatusTone('error');
        return;
      }

      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    if (!activeStore?.apiKey) {
      setStatusText('Select a store first.');
      setStatusTone('error');
      return;
    }

    if (!externalId.trim()) {
      setStatusText('Enter external product ID first.');
      setStatusTone('error');
      return;
    }

    setBusy(true);
    setStatusText('');

    try {
      const res = await fetch(`${API_BASE}/products/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeStore.apiKey,
        },
        body: JSON.stringify({
          externalId: externalId.trim(),
          name: name.trim() || 'Product',
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.id) {
        setStatusText(data?.error || 'Failed to add product.');
        setStatusTone('error');
        return;
      }

      setExternalId('');
      setName('');
      setStatusText('Product added successfully.');
      setStatusTone('success');
      await loadProducts(activeStore.id, activeStore.apiKey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Products
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 34 }}>Product catalog</h1>
            <div style={{ marginTop: 8, opacity: 0.72 }}>
              Manage product mapping for the selected store.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={linkButtonStyle()}>
              Dashboard
            </Link>
            <Link href="/orders" style={linkButtonStyle()}>
              Orders
            </Link>
            <Link href="/widget" style={linkButtonStyle()}>
              Widget debug
            </Link>
          </div>
        </div>

        {statusText ? (
          <div
            style={{
              background:
                statusTone === 'success' ? '#f0fdf4' :
                statusTone === 'error' ? '#fef2f2' :
                '#fff',
              border:
                statusTone === 'success' ? '1px solid #bbf7d0' :
                statusTone === 'error' ? '1px solid #fecaca' :
                '1px solid #e5e7eb',
              color:
                statusTone === 'success' ? '#166534' :
                statusTone === 'error' ? '#991b1b' :
                '#111827',
              borderRadius: 20,
              padding: 20,
            }}
          >
            {statusText}
          </div>
        ) : null}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          }}
        >
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            Store
          </label>

          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 12,
              border: '1px solid #d1d5db',
              borderRadius: 12,
              background: '#fff',
            }}
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} {store.storeType ? `(${store.storeType})` : ''}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.75 }}>
            <b>Store ID:</b> {storeId || '-'}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Add product</h2>

          <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
            <input
              placeholder="External Product ID"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              style={inputStyle()}
            />

            <input
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle()}
            />

            <button onClick={addProduct} disabled={busy} style={buttonStyle()}>
              {busy ? 'Adding...' : 'Add product'}
            </button>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Products</h2>

          {loading ? (
            <div>Loading...</div>
          ) : products.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 14,
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    background: '#fff',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7 }}>
                    <b>External ID:</b> {p.externalId || '-'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.7 }}>
                    <b>Internal ID:</b> {p.id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>No products found for this store yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 12,
    background: '#fff',
    fontSize: 14,
  };
}

function buttonStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #111827',
    background: '#111827',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function linkButtonStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
