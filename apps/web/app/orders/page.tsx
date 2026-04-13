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

type CreatedOrderResponse = {
  success?: boolean;
  orderId?: string;
  nudgeId?: string | null;
  nudgeStatus?: string | null;
  sendAfter?: string | null;
  message?: string;
  error?: string;
};

export default function OrdersPage() {
  const [token, setToken] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');
  const [lastResponse, setLastResponse] = useState<CreatedOrderResponse | null>(null);

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
    if (!activeStoreId) return;
    localStorage.setItem('review_infra_store_id', activeStoreId);
    if (stores.length) {
      loadProducts(activeStoreId);
    }
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
      setStatusTone('error');
      return;
    }

    setStores(data);

    const localStoreId = localStorage.getItem('review_infra_store_id') || '';
    const nextActive = localStoreId || data[0]?.id || '';
    const exists = data.some((s: Store) => s.id === nextActive);
    const finalStoreId = exists ? nextActive : (data[0]?.id || '');

    setActiveStoreId(finalStoreId);
  }

  async function loadProducts(storeId: string) {
    const apiKey = stores.find((s) => s.id === storeId)?.apiKey || '';

    if (!storeId || !apiKey) {
      setProducts([]);
      setProductId('');
      return;
    }

    const res = await fetch(`${API_BASE}/store/${storeId}/products`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = await safeJson(res);

    if (!res.ok || !Array.isArray(data)) {
      setProducts([]);
      setProductId('');
      return;
    }

    setProducts(data);
    setProductId((current) => {
      if (current && data.some((p: Product) => p.id === current)) return current;
      return data[0]?.id || '';
    });
  }

  async function createOrder() {
    if (!activeStore) {
      setStatusText('Select a store first.');
      setStatusTone('error');
      return;
    }

    if (!productId) {
      setStatusText('Select a product first.');
      setStatusTone('error');
      return;
    }

    if (!customerEmail.trim()) {
      setStatusText('Enter customer email first.');
      setStatusTone('error');
      return;
    }

    setBusy(true);
    setStatusText('');
    setLastResponse(null);

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: activeStore.id,
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim() || undefined,
          productId,
          orderRef: orderRef.trim() || undefined,
          externalOrderId: externalOrderId.trim() || undefined,
        }),
      });

      const data = (await safeJson(res)) as CreatedOrderResponse | null;

      if (!res.ok || !data?.success) {
        setStatusText(data?.error || 'Failed to create order.');
        setStatusTone('error');
        setLastResponse(data || null);
        return;
      }

      setLastResponse(data);
      setStatusText(data.message || 'Order created.');
      setStatusTone('success');

      if (!externalOrderId.trim()) {
        setExternalOrderId(`manual_${Date.now()}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' })}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Orders
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(26px, 6vw, 34px)' }}>Create order and queue review request</h1>
            <div style={{ marginTop: 8, opacity: 0.72 }}>
              Use this page to test the order → nudge automation flow for any store.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={linkButtonStyle('secondary')}>
              Dashboard
            </Link>
            {activeStoreId ? (
              <Link href={`/stores/${activeStoreId}/setup`} style={linkButtonStyle('secondary')}>
                Store setup
              </Link>
            ) : null}
            <Link href="/nudges" style={linkButtonStyle('secondary')}>
              Nudges
            </Link>
          </div>
        </div>

        {statusText ? (
          <div
            style={cardStyle({
              borderColor:
                statusTone === 'success' ? '#86efac' :
                statusTone === 'error' ? '#fca5a5' :
                '#e5e7eb',
              background:
                statusTone === 'success' ? '#f0fdf4' :
                statusTone === 'error' ? '#fef2f2' :
                '#fff',
              color:
                statusTone === 'success' ? '#166534' :
                statusTone === 'error' ? '#991b1b' :
                '#111827',
            })}
          >
            {statusText}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Order details</h2>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle()}>Store</label>
                  <select
                    value={activeStoreId}
                    onChange={(e) => setActiveStoreId(e.target.value)}
                    style={inputStyle()}
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
                  <label style={labelStyle()}>Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    style={inputStyle()}
                    disabled={!products.length}
                  >
                    <option value="">{products.length ? 'Select product' : 'No products found'}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}{product.externalId ? ` — ${product.externalId}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Customer email</label>
                  <input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Customer name</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Order reference</label>
                  <input
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="Order #1001"
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>External order ID</label>
                  <input
                    value={externalOrderId}
                    onChange={(e) => setExternalOrderId(e.target.value)}
                    placeholder="shopify_12345 or custom_12345"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button disabled={busy} onClick={createOrder} style={buttonStyle('primary')}>
                    {busy ? 'Creating...' : 'Create order'}
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => {
                      setCustomerEmail('test@example.com');
                      setCustomerName('Test Customer');
                      setOrderRef(`Order-${Date.now()}`);
                      setExternalOrderId(`manual_${Date.now()}`);
                    }}
                    style={buttonStyle('secondary')}
                  >
                    Fill sample data
                  </button>
                </div>
              </div>
            </div>

            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>What this does</h2>
              <div style={{ display: 'grid', gap: 10, opacity: 0.78, lineHeight: 1.7 }}>
                <div>1. Creates or updates an order for the selected store and product.</div>
                <div>2. Checks if a pending or sent review nudge already exists.</div>
                <div>3. Creates a pending nudge if needed.</div>
                <div>4. Uses your automation delay to decide when the review request should go out.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20, alignSelf: 'start' }}>
            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Active store summary</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <div><b>Name:</b> {activeStore?.name || '-'}</div>
                <div><b>Type:</b> {activeStore?.storeType || '-'}</div>
                <div><b>API key:</b> {activeStore?.apiKey || '-'}</div>
                <div><b>Products loaded:</b> {products.length}</div>
              </div>
            </div>

            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Latest response</h2>

              {!lastResponse ? (
                <div style={{ opacity: 0.7 }}>No order created yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10, fontSize: 14, wordBreak: 'break-word' }}>
                  <div><b>Success:</b> {String(!!lastResponse.success)}</div>
                  <div><b>Order ID:</b> {lastResponse.orderId || '-'}</div>
                  <div><b>Nudge ID:</b> {lastResponse.nudgeId || '-'}</div>
                  <div><b>Nudge status:</b> {lastResponse.nudgeStatus || '-'}</div>
                  <div><b>Send after:</b> {lastResponse.sendAfter ? new Date(lastResponse.sendAfter).toLocaleString() : '-'}</div>
                  <div><b>Message:</b> {lastResponse.message || lastResponse.error || '-'}</div>
                </div>
              )}
            </div>

            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Next checks</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/nudges">Open nudges page</Link>
                <Link href="/analytics">Open analytics</Link>
                <Link href="/moderation">Open moderation</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    ...extra,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 12,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
  };
}

function buttonStyle(kind: 'primary' | 'secondary' = 'secondary'): React.CSSProperties {
  if (kind === 'primary') {
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

  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function linkButtonStyle(kind: 'primary' | 'secondary' = 'secondary'): React.CSSProperties {
  if (kind === 'primary') {
    return {
      padding: '12px 16px',
      borderRadius: 12,
      border: '1px solid #111827',
      background: '#111827',
      color: '#fff',
      fontWeight: 700,
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

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
