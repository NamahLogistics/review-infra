'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Store = {
  id: string;
  name: string;
  apiKey: string;
  plan: string;
  storeType?: 'shopify' | 'custom';
  shopDomain: string | null;
  connectionStatus: string;
};

type Product = {
  id: string;
  name: string;
  externalId?: string | null;
};

type ReviewSettings = {
  isEnabled: boolean;
  nudgingLevel: string;
  sendDelayDays: number;
  followUpDelayDays: number;
  maxReminders: number;
  emailSubject: string;
  emailBody: string;
};

type WidgetStatus = {
  success?: boolean;
  installed?: boolean;
  count?: number;
  error?: string;
};

export default function StoreSetupPage() {
  const params = useParams();
  const storeId = String(params?.storeId || '');

  const [token, setToken] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus | null>(null);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('review_infra_user_token') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token || !storeId) return;
    loadAll(token, storeId);
  }, [token, storeId]);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadAll(authToken: string, sId: string) {
    setBusy(true);
    try {
      const storesRes = await fetch(`${API_BASE}/stores`, {
        headers: { authorization: `Bearer ${authToken}` },
      });

      const storesData = await safeJson(storesRes);
      const matchedStore = Array.isArray(storesData)
        ? storesData.find((s: Store) => s.id === sId) || null
        : null;

      setStore(matchedStore);

      const settingsRes = await fetch(`${API_BASE}/review-settings/${sId}`, {
        headers: { authorization: `Bearer ${authToken}` },
      });
      const settingsData = await safeJson(settingsRes);
      if (settingsRes.ok && settingsData) {
        setSettings(settingsData);
      } else {
        setSettings(null);
      }

      if (matchedStore?.apiKey) {
        const productsRes = await fetch(`${API_BASE}/store/${sId}/products`, {
          headers: {
            'x-api-key': matchedStore.apiKey,
          },
        });

        const productsData = await safeJson(productsRes);
        if (productsRes.ok && Array.isArray(productsData)) {
          setProducts(productsData);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }

      if (matchedStore?.storeType === 'shopify') {
        const widgetRes = await fetch(`${API_BASE}/shopify/widget-status/${sId}`);
        const widgetData = await safeJson(widgetRes);
        setWidgetStatus(widgetData || null);
      } else {
        setWidgetStatus(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatusText(successMessage);
      setStatusTone('success');
    } catch {
      setStatusText('Copy failed. Please copy manually.');
      setStatusTone('error');
    }
  }

  async function updateReviewSettings(body: Partial<ReviewSettings>) {
    if (!token || !store) return;

    setBusy(true);
    setStatusText('');
    try {
      const res = await fetch(`${API_BASE}/review-settings/${store.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok || !data) {
        setStatusText(data?.error || 'Failed to update settings.');
        setStatusTone('error');
        return;
      }

      setSettings(data);
      setStatusText('Automation updated.');
      setStatusTone('success');
    } finally {
      setBusy(false);
    }
  }

  async function runInstallAction(path: 'install-widget' | 'reinstall-widget' | 'remove-widget', successText: string) {
    if (!store) return;

    setBusy(true);
    setStatusText('');
    try {
      const res = await fetch(`${API_BASE}/shopify/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        setStatusText(data?.error || 'Failed.');
        setStatusTone('error');
        return;
      }

      setStatusText(successText);
      setStatusTone('success');

      const widgetRes = await fetch(`${API_BASE}/shopify/widget-status/${store.id}`);
      const widgetData = await safeJson(widgetRes);
      setWidgetStatus(widgetData || null);
    } finally {
      setBusy(false);
    }
  }

  const installSnippet = useMemo(() => {
    if (!store) return '';
    return `<script
  src="${API_BASE}/embed/widget.js?storeId=${store.id}">
</script>`;
  }, [store]);

  const firstProductId = useMemo(() => {
    const first = products[0];
    if (!first) return '';
    return first.externalId || first.id;
  }, [products]);

  const submitReviewHref = useMemo(() => {
    if (!store?.apiKey || !firstProductId) return '';
    return `/submit-review?apiKey=${encodeURIComponent(store.apiKey)}&productId=${encodeURIComponent(firstProductId)}&authorName=${encodeURIComponent('Test User')}&authorEmail=${encodeURIComponent('test@example.com')}`;
  }, [store, firstProductId]);

  const steps = useMemo(() => {
    if (!store) return [];

    if (store.storeType === 'shopify') {
      return [
        { key: 'select_store', title: 'Store selected', done: true, action: null },
        {
          key: 'connect_shopify',
          title: 'Connect Shopify',
          done: store.connectionStatus === 'connected' && !!store.shopDomain,
          action: 'connect_shopify',
        },
        {
          key: 'install_widget',
          title: 'Install widget',
          done: !!widgetStatus?.installed,
          action: 'install_widget',
        },
        {
          key: 'enable_nudges',
          title: 'Enable review automation',
          done: !!settings?.isEnabled,
          action: 'enable_nudges',
        },
        {
          key: 'test_review',
          title: 'Submit a test review',
          done: false,
          action: 'test_review',
        },
      ];
    }

    return [
      { key: 'select_store', title: 'Store selected', done: true, action: null },
      { key: 'copy_script', title: 'Copy widget script', done: false, action: 'copy_script' },
      { key: 'install_script', title: 'Add script to your product page', done: false, action: 'copy_script' },
      { key: 'enable_nudges', title: 'Enable review automation', done: !!settings?.isEnabled, action: 'enable_nudges' },
      { key: 'test_review', title: 'Submit a test review', done: false, action: 'test_review' },
    ];
  }, [store, widgetStatus, settings]);

  const completed = steps.filter((s) => s.done).length;

  if (!token) {
    return (
      <main style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={cardStyle({ minWidth: 0 })}>
            <h1 style={{ marginTop: 0 }}>Store Setup</h1>
            <div>Please log in first.</div>
            <div style={{ marginTop: 16 }}>
              <Link href="/dashboard">Go to dashboard</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' })}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Guided setup
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(26px, 6vw, 34px)' }}>
              {store ? `${store.name} Setup` : 'Store Setup'}
            </h1>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              {store
                ? `Follow this setup flow for your ${store.storeType === 'shopify' ? 'Shopify' : 'custom/headless'} store.`
                : 'Loading store...'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={linkButtonStyle('secondary')}>
              Back to dashboard
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Checklist</h2>
                  <div style={{ marginTop: 8, opacity: 0.7 }}>
                    {completed} / {steps.length} completed
                  </div>
                </div>

                <div style={{ minWidth: 220, width: '100%', maxWidth: 320 }}>
                  <div style={{ height: 10, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${steps.length ? (completed / steps.length) * 100 : 0}%`,
                        height: '100%',
                        background: '#111827',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 16,
                      padding: 16,
                      background: step.done ? '#f0fdf4' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 999,
                            display: 'grid',
                            placeItems: 'center',
                            background: step.done ? '#166534' : '#e5e7eb',
                            color: step.done ? '#fff' : '#111827',
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{step.title}</div>
                          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.7 }}>
                            {step.done ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                      </div>

                      {!step.done && step.action === 'connect_shopify' && store ? (
                        <Link
                          href="/dashboard"
                          style={linkButtonStyle('primary')}
                          onClick={() => {
                            localStorage.setItem('review_infra_store_id', store.id);
                          }}
                        >
                          Open dashboard
                        </Link>
                      ) : null}

                      {!step.done && step.action === 'install_widget' ? (
                        <button
                          disabled={busy}
                          onClick={() => runInstallAction('install-widget', 'Widget installed successfully.')}
                          style={buttonStyle('primary')}
                        >
                          {busy ? 'Working...' : 'Install widget'}
                        </button>
                      ) : null}

                      {!step.done && step.action === 'copy_script' ? (
                        <button
                          disabled={busy}
                          onClick={() => copyText(installSnippet, 'Widget script copied.')}
                          style={buttonStyle('primary')}
                        >
                          Copy script
                        </button>
                      ) : null}

                      {!step.done && step.action === 'enable_nudges' ? (
                        <button
                          disabled={busy}
                          onClick={() => updateReviewSettings({ isEnabled: true })}
                          style={buttonStyle('primary')}
                        >
                          {busy ? 'Working...' : 'Enable automation'}
                        </button>
                      ) : null}

                      {step.action === 'test_review' ? (
                        submitReviewHref ? (
                          <Link href={submitReviewHref} target="_blank" style={linkButtonStyle('secondary')}>
                            Open submit form
                          </Link>
                        ) : (
                          <div style={{ fontSize: 13, opacity: 0.7 }}>
                            Add at least one product first.
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {store?.storeType === 'custom' ? (
              <div style={cardStyle({ minWidth: 0 })}>
                <h2 style={{ marginTop: 0 }}>Install widget on your custom store</h2>
                <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
                  Add this script to your product page template. It will load the widget for this specific store.
                </div>

                <pre
                  style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 16,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
{installSnippet}
                </pre>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    onClick={() => copyText(installSnippet, 'Widget script copied.')}
                    style={buttonStyle('primary')}
                  >
                    Copy script
                  </button>

                  <Link href="/reviews-demo" style={linkButtonStyle('secondary')}>
                    Open widget demo
                  </Link>
                </div>
              </div>
            ) : null}

            {store?.storeType === 'shopify' ? (
              <div style={cardStyle({ minWidth: 0 })}>
                <h2 style={{ marginTop: 0 }}>Shopify install status</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div><b>Connection:</b> {store.connectionStatus || '-'}</div>
                  <div><b>Shop domain:</b> {store.shopDomain || '-'}</div>
                  <div><b>Widget installed:</b> {widgetStatus?.installed ? 'Yes' : 'No'}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <Link
                    href="/dashboard"
                    style={linkButtonStyle('secondary')}
                    onClick={() => {
                      localStorage.setItem('review_infra_store_id', store.id);
                    }}
                  >
                    Connect in dashboard
                  </Link>

                  <button
                    disabled={busy}
                    onClick={() => runInstallAction('reinstall-widget', 'Widget reinstalled successfully.')}
                    style={buttonStyle('secondary')}
                  >
                    Reinstall widget
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 20, alignSelf: 'start' }}>
            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Store summary</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <div><b>Name:</b> {store?.name || '-'}</div>
                <div><b>Type:</b> {store?.storeType || '-'}</div>
                <div><b>Plan:</b> {store?.plan || '-'}</div>
                <div><b>Shopify connection:</b> {store?.connectionStatus || '-'}</div>
                <div><b>Automation enabled:</b> {settings?.isEnabled ? 'Yes' : 'No'}</div>
                <div><b>Products:</b> {products.length}</div>
              </div>
            </div>

            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Quick links</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/moderation">Moderation</Link>
                <Link href="/nudges">Nudges</Link>
                <Link href="/analytics">Analytics</Link>
                <Link href="/orders">Orders</Link>
                <Link href="/products">Products</Link>
                <Link href="/widget">Widget debug</Link>
                <Link href="/reviews-demo">Widget demo</Link>
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
