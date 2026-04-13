'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import InstallButton from '../components/InstallButton';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type User = {
  id: string;
  email: string;
};

type Store = {
  id: string;
  name: string;
  apiKey: string;
  plan: string;
  storeType?: 'shopify' | 'custom';
  shopDomain: string | null;
  connectionStatus: string;
  shopifyConnectedAt?: string | null;
  shopifyUninstalledAt?: string | null;
};

type StatusTone = 'default' | 'success' | 'error';

type ReviewSettings = {
  isEnabled: boolean;
  nudgingLevel: string;
  sendDelayDays: number;
  followUpDelayDays: number;
  maxReminders: number;
  emailSubject: string;
  emailBody: string;
};

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

function buttonStyle(kind: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties {
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

  if (kind === 'danger') {
    return {
      padding: '12px 16px',
      borderRadius: 12,
      border: '1px solid #ef4444',
      background: '#fff',
      color: '#b91c1c',
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

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 12,
    fontSize: 14,
    outline: 'none',
  };
}

function normalizeShopDomain(value: string) {
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (!trimmed) return '';
  return trimmed.endsWith('.myshopify.com') ? trimmed : `${trimmed}.myshopify.com`;
}

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shop, setShop] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
const [storeType, setStoreType] = useState<"shopify" | "custom">("shopify");


  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<StatusTone>('default');
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [widgetStatusRefresh, setWidgetStatusRefresh] = useState(0);
const [stats, setStats] = useState<any>(null);
const [judgeToken, setJudgeToken] = useState('');
const [showJudgeHelp, setShowJudgeHelp] = useState(false);
const [judgeConnectedAt, setJudgeConnectedAt] = useState<string | null>(null);

  const activeStore = useMemo(
    () => stores.find((s) => s.id === activeStoreId) || null,
    [stores, activeStoreId]
  );

  const installSnippet = useMemo(() => {
    if (!activeStore) return '';
    return `<script
  src="${API_BASE}/embed/widget.js?storeId=${activeStore.id}">
</script>`;
  }, [activeStore]);

  function showStatus(message: string, tone: StatusTone = 'default') {
    setStatusText(message);
    setStatusTone(tone);
  }

  function refreshWidgetStatus() {
    setWidgetStatusRefresh((v) => v + 1);
  }

  async function importCsv() {
    if (!activeStore) return;

    const res = await fetch(`${API_BASE}/import/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': activeStore.apiKey,
      },
      body: JSON.stringify({
        rows: [
          {
            productName: 'Night',
            authorName: 'Aman',
            rating: 5,
            text: 'Amazing product'
          },
          {
            productName: 'Night',
            authorName: 'Priya',
            rating: 4,
            text: 'Very good'
          }
        ]
      }),
    });

    const data = await res.json();
    alert(data.success ? 'Imported successfully' : data.error || 'Import failed');
    loadStats();
  }

  async function saveJudgeToken() {
    if (!activeStore || !judgeToken.trim() || !token) {
      showStatus('Enter Judge.me token first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Saving Judge.me connection...');

    try {
      const res = await fetch(`${API_BASE}/judgeme/${activeStore.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: judgeToken.trim() }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        showStatus(data?.error || 'Failed to save Judge.me token.', 'error');
        return;
      }

      setJudgeToken(data.token || judgeToken.trim());
      setJudgeConnectedAt(data.connectedAt || null);
      showStatus('Judge.me connected successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function importJudge() {
    if (!activeStore || !token) {
      showStatus('Select a store first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Importing reviews from Judge.me...');

    try {
      const res = await fetch(`${API_BASE}/import/judgeme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storeId: activeStore.id }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        showStatus(data?.error || 'Judge.me import failed.', 'error');
        return;
      }

      showStatus(`Judge.me import complete. Imported ${data.imported}, skipped ${data.skipped}.`, 'success');
      loadStats();
    } finally {
      setBusy(false);
    }
  }

  async function loadStats() {
    if (!activeStoreId) return;
    const res = await fetch(`${API_BASE}/stores/${activeStoreId}/stats`);
    const data = await res.json();
    if (data?.success) setStats(data.stats);
  }

  function clearLocalSession() {
    localStorage.removeItem('review_infra_user_token');
    localStorage.removeItem('review_infra_store_id');
    setToken('');
    setUser(null);
    setStores([]);
    setActiveStoreId('');
    setEmail('');
    setPassword('');
    setShop('');
    setStoreName('');
    showStatus('Local session cleared. You can start fresh now.', 'success');
  }

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      showStatus(successMessage, 'success');
    } catch {
      showStatus('Copy failed. Please copy manually.', 'error');
    }
  }

  async function loadStores(authToken: string, preferredStoreId?: string) {
    const storesRes = await fetch(`${API_BASE}/stores`, {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    const storesData = await safeJson(storesRes);

    if (!storesRes.ok || !Array.isArray(storesData)) {
      showStatus('Failed to load stores.', 'error');
      return;
    }

    setStores(storesData);

    const localStoreId = localStorage.getItem('review_infra_store_id') || '';
    const nextActive =
      preferredStoreId ||
      localStoreId ||
      storesData[0]?.id ||
      '';

    const exists = storesData.some((s: Store) => s.id === nextActive);
    const finalActive = exists ? nextActive : (storesData[0]?.id || '');

    setActiveStoreId(finalActive);

    if (finalActive) {
      localStorage.setItem('review_infra_store_id', finalActive);
    } else {
      localStorage.removeItem('review_infra_store_id');
    }
  }


  async function loadJudgeSettings(authToken: string, storeId: string) {
  const res = await fetch(`${API_BASE}/judgeme/${storeId}`, {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  });

  const data = await safeJson(res);

  if (res.ok && data?.success) {
    setJudgeToken(data.token || '');
    setJudgeConnectedAt(data.connectedAt || null);
  } else {
    setJudgeToken('');
    setJudgeConnectedAt(null);
  }
}

async function loadReviewSettings(authToken: string, storeId: string) {
    const res = await fetch(`${API_BASE}/review-settings/${storeId}`, {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    const data = await safeJson(res);

    if (res.ok && data) {
      setSettings(data);
    }
  }

  async function updateReviewSettings(body: Partial<ReviewSettings>) {
    if (!token || !activeStore) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/review-settings/${activeStore.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok || !data) {
        showStatus(data?.error || 'Failed to update review settings.', 'error');
        return;
      }

      setSettings(data);
      showStatus('Review settings updated.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function sendTestEmail() {
    if (!token || !activeStore || !testEmail.trim()) {
      showStatus('Enter a test email first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Sending test email...');

    try {
      const res = await fetch(`${API_BASE}/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: activeStore.id,
          email: testEmail.trim(),
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        showStatus(data?.error || 'Failed to send test email.', 'error');
        return;
      }

      showStatus('Test email sent successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const params = new URLSearchParams(window.location.search);
        const storeIdFromUrl = params.get('storeId') || '';
        const connected = params.get('connected') || '';
        const error = params.get('error') || '';

        const savedToken = localStorage.getItem('review_infra_user_token') || '';

        if (!savedToken) {
          setBooting(false);
          return;
        }

        setToken(savedToken);

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            authorization: `Bearer ${savedToken}`,
          },
        });

        const meData = await safeJson(meRes);

        if (!meRes.ok || !meData?.id) {
          clearLocalSession();
          setBooting(false);
          return;
        }

        setUser(meData);
        await loadStores(savedToken, storeIdFromUrl);

        if (connected === '1') {
          showStatus('Shopify connected successfully.', 'success');
        } else if (error) {
          showStatus(error, 'error');
        }

        if (storeIdFromUrl || connected === '1' || error) {
          window.history.replaceState({}, '', '/dashboard');
        }
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (activeStoreId) {
      loadStats();
      localStorage.setItem('review_infra_store_id', activeStoreId);
    }
  }, [activeStoreId]);


  useEffect(() => {
    if (activeStoreId && token) {
      loadReviewSettings(token, activeStoreId);
      loadJudgeSettings(token, activeStoreId);
    } else {
      setSettings(null);
    }
  }, [activeStoreId, token]);


  async function register() {
    if (!email.trim()) {
      showStatus('Enter your email first.', 'error');
      return;
    }

    if (password.length < 8) {
      showStatus('Password must be at least 8 characters.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Creating your account...');

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.token) {
        showStatus(data?.error || 'Registration failed.', 'error');
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('review_infra_user_token', data.token);
      await loadStores(data.token);
      showStatus('Account created successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    if (!email.trim()) {
      showStatus('Enter your email first.', 'error');
      return;
    }

    if (!password) {
      showStatus('Enter your password first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Signing you in...');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.token) {
        showStatus(data?.error || 'Login failed.', 'error');
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('review_infra_user_token', data.token);
      await loadStores(data.token);
      showStatus('Logged in successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function createStore() {
    if (!token) {
      showStatus('Please log in first.', 'error');
      return;
    }

    if (!storeName.trim()) {
      showStatus('Enter a store name first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Creating store...');

    try {
      const res = await fetch(`${API_BASE}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: storeName.trim(), storeType }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.id) {
        showStatus(data?.error || 'Store creation failed.', 'error');
        return;
      }

      setStoreName('');
      await loadStores(token, data.id);
      showStatus('Store created successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function deleteStore() {
    if (!token || !activeStore) {
      showStatus('Select a store first.', 'error');
      return;
    }

    const ok = window.confirm(`Delete "${activeStore.name}"? This will remove its products, reviews, nudges, and events.`);
    if (!ok) return;

    setBusy(true);
    showStatus('Deleting store...');

    try {
      const res = await fetch(`${API_BASE}/stores/${activeStore.id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        showStatus(data?.error || 'Failed to delete store.', 'error');
        return;
      }

      await loadStores(token);
      setShop('');
      showStatus('Store deleted successfully.', 'success');
    } finally {
      setBusy(false);
    }
  }

  function connectShopify() {
    const finalShop = normalizeShopDomain(shop);

    if (!activeStore) {
      showStatus('Create or select a store first.', 'error');
      return;
    }

    if (!finalShop || !finalShop.endsWith('.myshopify.com')) {
      showStatus('Enter a valid Shopify domain like example.myshopify.com', 'error');
      return;
    }

    showStatus('Redirecting to Shopify...');
    window.location.href = `${API_BASE}/shopify/auth/start?shop=${encodeURIComponent(finalShop)}&storeId=${encodeURIComponent(activeStore.id)}`;
  }

  async function syncProducts() {
    if (!activeStore) {
      showStatus('Select a store first.', 'error');
      return;
    }

    setBusy(true);
    showStatus('Syncing products...');

    try {
      const res = await fetch(`${API_BASE}/shopify/sync-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStore.id }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        showStatus(data?.error || 'Product sync failed.', 'error');
        return;
      }

      showStatus(`Products synced: ${data?.synced ?? 0}`, 'success');
    } finally {
      setBusy(false);
    }
  }

  async function upgrade() {
    if (!activeStore) return;

    setBusy(true);
    showStatus('Opening checkout...');

    try {
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStore.id }),
      });

      const data = await safeJson(res);

      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        showStatus('Checkout opened in a new tab.', 'success');
        return;
      }

      showStatus(data?.error || 'Checkout not configured yet.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function statusBadge(store: Store) {
    const value = store.connectionStatus || 'draft';

    if (value === 'connected') {
      return {
        text: 'Connected',
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        },
      };
    }

    if (value === 'uninstalled') {
      return {
        text: 'Uninstalled',
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
      };
    }

    return {
      text: 'Draft',
      style: {
        background: '#f8fafc',
        color: '#334155',
        border: '1px solid #cbd5e1',
      },
    };
  }

  if (booting) {
    return (
      <main style={{ padding: '24px 16px', fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={cardStyle({ minWidth: 0 })}>
            <h1 style={{ marginTop: 0 }}>Dashboard</h1>
            <div style={{ opacity: 0.7 }}>Loading your workspace...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '24px 16px', fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' })}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>Review Infra</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(26px, 6vw, 34px)'}}>Merchant Dashboard</h1>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              Manage all your store workspaces in one place.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={clearLocalSession} style={buttonStyle('secondary')}>
              Reset local state
            </button>
            {token ? (
              <button onClick={clearLocalSession} style={buttonStyle('danger')}>
                Logout
              </button>
            ) : null}
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

        {!token ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Sign in</h2>
              <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                <input placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} />
                <input placeholder="Enter password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle()} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button disabled={busy} onClick={register} style={buttonStyle('secondary')}>
                    {busy ? 'Working...' : 'Register'}
                  </button>
                  <button disabled={busy} onClick={login} style={buttonStyle('primary')}>
                    {busy ? 'Working...' : 'Login'}
                  </button>
                </div>
              </div>
            </div>

            <div style={cardStyle({ minWidth: 0 })}>
              <h2 style={{ marginTop: 0 }}>Flow</h2>
              <div style={{ display: 'grid', gap: 12, opacity: 0.8, lineHeight: 1.7 }}>
                <div>1. Log in</div>
                <div>2. Create one or more store workspaces</div>
                <div>3. Select a store</div>
                <div>4. Connect Shopify for that store</div>
                <div>5. Copy widget snippet or import data</div>
              </div>
            </div>
          </div>
        ) : null}

        {token && user ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div style={{ display: 'grid', gap: 20, alignSelf: 'start' }}>
              <div style={cardStyle({ minWidth: 0 })}>
                <h2 style={{ marginTop: 0 }}>Your stores</h2>
                <div style={{ marginBottom: 14, opacity: 0.75 }}>Signed in as {user.email}</div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {stores.length ? stores.map((store) => {
                    const badge = statusBadge(store);
                    const isActive = activeStoreId === store.id;

                    return (
                      <button
                        key={store.id}
                        onClick={() => setActiveStoreId(store.id)}
                        style={{
                          textAlign: 'left',
                          borderRadius: 16,
                          border: isActive ? '2px solid #111827' : '1px solid #e5e7eb',
                          background: isActive ? '#f8fafc' : '#fff',
                          padding: 14,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                          <div style={{ fontWeight: 800 }}>{store.name}</div>
                          <span
                            style={{
                              ...badge.style,
                              borderRadius: 999,
                              padding: '4px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7 }}>{store.shopDomain || 'No Shopify store connected yet'}</div>
                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>Plan: {store.plan}</div>

                        <div style={{ marginTop: 12 }}>
                          <Link
                            href={`/stores/${store.id}/setup`}
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem('review_infra_store_id', store.id);
                            }}
                            style={{
                              display: 'inline-flex',
                              padding: '10px 12px',
                              borderRadius: 10,
                              border: '1px solid #d1d5db',
                              textDecoration: 'none',
                              color: '#111827',
                              fontWeight: 700,
                              background: '#fff',
                            }}
                          >
                            Open setup
                          </Link>
                        </div>
                      </button>
                    );
                  }) : (
                    <div style={{ opacity: 0.7 }}>No stores yet. Create your first workspace below.</div>
                  )}
                </div>
              </div>

              <div style={cardStyle({ minWidth: 0 })}>
                <h2 style={{ marginTop: 0 }}>Create store workspace</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value as 'shopify' | 'custom')}
                    style={inputStyle()}
                  >
                    <option value="shopify">Shopify Store</option>
                    <option value="custom">Custom / Headless Store</option>
                  </select>

                  <input
                    placeholder="Store name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    style={inputStyle()}
                  />

                  <button disabled={busy} onClick={createStore} style={buttonStyle('primary')}>
                    {busy ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              {!activeStore ? (
                <div style={cardStyle({ minWidth: 0 })}>
                  <h2 style={{ marginTop: 0 }}>Select a store</h2>
                  <div style={{ opacity: 0.75 }}>Choose a store from the left, or create a new one.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div style={cardStyle({ minWidth: 0 })}>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>Store</div>
                      <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>{activeStore.name}</div>
                    </div>

                    <div style={cardStyle({ minWidth: 0 })}>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>Shopify</div>
                      <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>{activeStore.shopDomain || 'Not connected'}</div>
                    </div>

                    <div style={cardStyle({ minWidth: 0 })}>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>Plan</div>
                      <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>{activeStore.plan}</div>
                    </div>

                    <div style={cardStyle({ minWidth: 0 })}>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>Status</div>
                      <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>{statusBadge(activeStore).text}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    <div style={cardStyle({ minWidth: 0 })}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <h2 style={{ margin: 0 }}>Install snippet</h2>
                          <div style={{ marginTop: 8, opacity: 0.7 }}>
                            Use this only if you want a manual fallback. The recommended setup is the Shopify install button on the right.
                          </div>
                        </div>
                        <button onClick={() => copyText(installSnippet, 'Install snippet copied.')} style={buttonStyle('secondary')}>
                          Copy snippet
                        </button>
                      </div>

                      <pre
                        style={{
                          marginTop: 16,
                          background: '#0f172a',
                          color: '#e2e8f0',
                          padding: 16,
                          borderRadius: 16,
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

                      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                        <div><b>Shopify theme fallback:</b> install button is recommended first</div>
                        <div><b>Manual snippet:</b> store-linked and reconnect-safe</div>
                        <div><b>No API key needed:</b> Review Infra resolves the current config automatically</div>
                      </div>
                    </div>

                    <div style={cardStyle({ minWidth: 0 })}>
                      <h2 style={{ marginTop: 0 }}>Store actions</h2>

                      <div style={{ display: 'grid', gap: 12 }}>
                        <div
                          style={{
                            fontSize: 14,
                            color: '#334155',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: 12,
                            borderRadius: 12,
                            lineHeight: 1.6,
                          }}
                        >
                          This widget install is managed by Review Infra. You do not need to handle API keys manually.
                        </div>

                        {activeStore?.storeType !== 'custom' ? (
                          <>
                            <input
                              placeholder="your-store.myshopify.com"
                              value={shop}
                              onChange={(e) => setShop(e.target.value)}
                              style={inputStyle()}
                            />

                            <button disabled={busy} onClick={connectShopify} style={buttonStyle('primary')}>
                              {activeStore.connectionStatus === 'connected' ? 'Reconnect Shopify' : 'Connect Shopify'}
                            </button>

                            <button disabled={busy || activeStore.connectionStatus !== 'connected'} onClick={syncProducts} style={buttonStyle('secondary')}>
                              Sync products
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: 14, color: '#334155', background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 12, lineHeight: 1.6 }}>
                            This workspace uses the custom / headless flow. Add products, install the snippet, and send orders to the Orders API.
                          </div>
                        )}

                        {activeStore.connectionStatus === 'connected' ? (
                          <div style={{ fontSize: 14, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 12 }}>
                            Shopify connected: {activeStore.shopDomain}
                          </div>
                        ) : activeStore.connectionStatus === 'uninstalled' ? (
                          <div style={{ fontSize: 14, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 12 }}>
                            This Shopify app was uninstalled. Reconnect to restore sync.
                          </div>
                        ) : (
                          <div style={{ fontSize: 14, color: '#334155', background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 12 }}>
                            This workspace is ready. Connect Shopify when you want.
                          </div>
                        )}

                        {activeStore.plan === 'free' ? (
                          <button disabled={busy} onClick={upgrade} style={buttonStyle('secondary')}>
                            Upgrade this store to Pro
                          </button>
                        ) : null}

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <a href="/imports" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                            Open Imports
                          </a>

                          <a href="/moderation" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                            Open Moderation
                          </a>
                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ fontWeight: 700 }}>Import from Judge.me</div>

                          <input
                            placeholder="Judge.me private token"
                            value={judgeToken}
                            onChange={(e) => setJudgeToken(e.target.value)}
                            style={inputStyle()}
                          />

                          <div
                            style={{
                              fontSize: 13,
                              color: judgeToken ? '#166534' : '#334155',
                              background: judgeToken ? '#f0fdf4' : '#f8fafc',
                              border: judgeToken ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                              padding: 12,
                              borderRadius: 12,
                              lineHeight: 1.6,
                            }}
                          >
                            {judgeToken
                              ? `Connected${judgeConnectedAt ? ` on ${new Date(judgeConnectedAt).toLocaleString()}` : ''}`
                              : 'Not connected'}
                          </div>

                          <button
                            disabled={busy}
                            onClick={saveJudgeToken}
                            style={buttonStyle('secondary')}
                          >
                            {judgeToken ? 'Update token' : 'Save token'}
                          </button>

                          <button
                            disabled={busy}
                            onClick={importJudge}
                            style={buttonStyle('secondary')}
                          >
                            Sync Judge.me reviews
                          </button>

                          <div
                            onClick={() => setShowJudgeHelp(!showJudgeHelp)}
                            style={{ fontSize: 13, color: '#2563eb', cursor: 'pointer' }}
                          >
                            {showJudgeHelp ? 'Hide steps' : 'How to get token?'}
                          </div>

                          {showJudgeHelp ? (
  <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
    <div>1. Open Judge.me in Shopify admin</div>
    <div>2. Go to Settings → Integrations</div>
    <div>3. Click "View API Token"</div>
    <div>4. Copy Private API Token</div>
    <div>5. Paste here and connect once</div>
  </div>
) : null}
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <Link
                            href={`/stores/${activeStore.id}/setup`}
                            onClick={() => {
                              localStorage.setItem('review_infra_store_id', activeStore.id);
                            }}
                            style={buttonStyle('secondary')}
                          >
                            Open full setup
                          </Link>

                          <InstallButton key={`${activeStore.id}-${widgetStatusRefresh}`} storeId={activeStore.id} />

                          <button disabled={busy} onClick={deleteStore} style={buttonStyle('danger')}>
                            Delete store
                          </button>
                        </div>
                      </div>
                    </div>
                  
                  <div style={cardStyle({ minWidth: 0 })}>
                    <h2 style={{ marginTop: 0 }}>Guided setup</h2>

                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>1. Store source</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          {activeStore?.storeType === 'custom'
                            ? 'This workspace is using a custom / headless website flow.'
                            : activeStore?.connectionStatus === 'connected'
                              ? `Shopify connected: ${activeStore.shopDomain || 'connected'}`
                              : 'Connect Shopify to sync products and enable one-click install.'}
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>2. Product catalog</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          {activeStore?.storeType === 'custom'
                            ? 'Use CSV import or create products for your custom site.'
                            : 'Sync Shopify products so reviews and emails attach to the right items.'}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                          Products: {stats?.products ?? 0}
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>3. Existing reviews</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          Import old reviews from Judge.me or CSV so the storefront starts with trust.
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>4. Moderation</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          New public reviews land in moderation before going live on the widget.
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                          Pending reviews: {stats?.pendingReviews ?? 0}
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>5. Review request emails</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          Customers receive a review request email after the configured delay.
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                          Delay: {settings?.sendDelayDays ?? 3} days · Follow-up: {settings?.followUpDelayDays ?? 2} days
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>6. Orders automation</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          Create a test order and verify that a review nudge gets queued with the correct delay.
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link
                              href="/orders"
                              style={{
                                display: 'inline-flex',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                textDecoration: 'none',
                                color: '#111827',
                                fontWeight: 700,
                                background: '#fff',
                              }}
                            >
                              Open orders
                            </Link>

                            <Link
                              href="/events"
                              style={{
                                display: 'inline-flex',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                textDecoration: 'none',
                                color: '#111827',
                                fontWeight: 700,
                                background: '#fff',
                              }}
                            >
                              Open events
                            </Link>

                            <Link
                              href="/products"
                              style={{
                                display: 'inline-flex',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                textDecoration: 'none',
                                color: '#111827',
                                fontWeight: 700,
                                background: '#fff',
                              }}
                            >
                              Open products
                            </Link>

                            <Link
                              href="/widget"
                              style={{
                                display: 'inline-flex',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                textDecoration: 'none',
                                color: '#111827',
                                fontWeight: 700,
                                background: '#fff',
                              }}
                            >
                              Widget debug
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                        <div style={{ fontWeight: 700 }}>7. Installation / order flow</div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
                          {activeStore?.storeType === 'custom'
                            ? 'Install the widget snippet manually and send orders to the Orders API so review emails start automatically.'
                            : 'Install the Shopify widget for one-click storefront setup. Manual snippet is available as fallback.'}
                        </div>
                        {activeStore?.storeType === 'custom' ? (
                          <pre
                            style={{
                              marginTop: 10,
                              background: '#0f172a',
                              color: '#e2e8f0',
                              padding: 12,
                              borderRadius: 12,
                              overflowX: 'auto',
whiteSpace: 'pre-wrap',
wordBreak: 'break-word',
maxWidth: '100%',
                              fontSize: 12,
                              lineHeight: 1.6,
                            }}
                          >{`POST ${API_BASE}/orders
{
  "storeId": "${activeStore.id}",
  "customerEmail": "user@email.com",
  "customerName": "Customer",
  "productId": "product_123",
  "orderRef": "order-001"
}`}</pre>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={cardStyle({ minWidth: 0 })}>
                    <h2 style={{ marginTop: 0 }}>Review automation</h2>

                    <div style={{ display: 'grid', gap: 12 }}>
                      <select
                        onChange={async (e) => {
                          const token = localStorage.getItem('review_infra_user_token') || '';
                          await fetch(`${API_BASE}/review-settings/${activeStore.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ nudgingLevel: e.target.value })
                          });
                          showStatus('Automation updated', 'success');
                        }}
                        style={inputStyle()}
                      >
                        <option value="low">Low nudging</option>
                        <option value="medium">Medium nudging</option>
                        <option value="high">High nudging</option>
                      </select>

                      <button
                        onClick={async () => {
                          const token = localStorage.getItem('review_infra_user_token') || '';
                          await fetch(`${API_BASE}/review-settings/${activeStore.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ isEnabled: false })
                          });
                          showStatus('Review system paused', 'success');
                        }}
                        style={buttonStyle('secondary')}
                      >
                        Pause reviews
                      </button>

                      <button
                        onClick={async () => {
                          const token = localStorage.getItem('review_infra_user_token') || '';
                          await fetch(`${API_BASE}/review-settings/${activeStore.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ isEnabled: true })
                          });
                          showStatus('Review system started', 'success');
                        }}
                        style={buttonStyle('primary')}
                      >
                        Start reviews
                      </button>
                    </div>
                  </div>
    
                </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}


