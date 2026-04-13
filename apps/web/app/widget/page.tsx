'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Store = {
  id: string;
  name: string;
  apiKey: string;
  storeType?: 'shopify' | 'custom';
  shopDomain?: string | null;
  connectionStatus?: string;
};

export default function WidgetPage() {
  const [token, setToken] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (!storeId) {
      setConfig(null);
      return;
    }
    localStorage.setItem('review_infra_store_id', storeId);
    loadConfig(storeId);
  }, [storeId]);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadStores(authToken: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/stores`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const data = await safeJson(res);

      if (!res.ok || !Array.isArray(data)) {
        setError('Failed to load stores.');
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

  async function loadConfig(s: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/widget-config/${s}`);
      const data = await safeJson(res);

      if (!res.ok || !data) {
        setError(data?.error || 'Failed to load widget config.');
        setConfig(null);
        return;
      }

      setConfig(data);
    } finally {
      setLoading(false);
    }
  }

  const installSnippet = useMemo(() => {
    if (!config || config.disabled) return '';
    return `<script
  src="${API_BASE}/embed/widget.js?storeId=${storeId}">
</script>`;
  }, [config, storeId]);

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
              Widget
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(26px, 6vw, 34px)' }}>Widget debug</h1>
            <div style={{ marginTop: 8, opacity: 0.72 }}>
              Check install readiness and copy the correct snippet.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={linkButtonStyle()}>
              Dashboard
            </Link>
            <Link href="/products" style={linkButtonStyle()}>
              Products
            </Link>
            <Link href="/reviews-demo" style={linkButtonStyle()}>
              Widget demo
            </Link>
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

        {error ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 20,
              padding: 20,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              minWidth: 0,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Store summary</h2>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div><b>Name:</b> {activeStore?.name || '-'}</div>
                <div><b>Type:</b> {activeStore?.storeType || '-'}</div>
                <div><b>Connection status:</b> {config?.connectionStatus || activeStore?.connectionStatus || '-'}</div>
                <div><b>Shop domain:</b> {config?.shopDomain || activeStore?.shopDomain || '-'}</div>
                <div><b>API key:</b> {config?.apiKey || activeStore?.apiKey || '-'}</div>
                <div><b>Widget enabled:</b> {config?.disabled ? 'No' : 'Yes'}</div>
              </div>
            )}
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              minWidth: 0,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Install snippet</h2>

            {config && !config.disabled ? (
              <pre
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: 16,
                  borderRadius: 16,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxWidth: '100%',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
{installSnippet}
              </pre>
            ) : (
              <div style={{ opacity: 0.7 }}>
                Widget config is disabled for this store right now.
              </div>
            )}
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
          <h2 style={{ marginTop: 0 }}>Raw config</h2>
          <pre
            style={{
              background: '#111827',
              color: '#d1fae5',
              padding: 16,
              borderRadius: 16,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: '100%',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
{JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
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
