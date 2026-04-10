'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shop, setShop] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('review_infra_user_token') || '';
    const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
    const savedApiKey = localStorage.getItem('review_infra_api_key') || '';

    if (!savedToken) return;

    setToken(savedToken);

    fetch(`${API_BASE}/auth/me`, {
      headers: {
        authorization: `Bearer ${savedToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setUser(data);
      });

    if (savedStoreId && savedApiKey) {
      fetch(`${API_BASE}/store/${savedStoreId}`, {
        headers: {
          'x-api-key': savedApiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.id) setStore(data);
        });
    }
  }, []);

  async function register() {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('review_infra_user_token', data.token);
    }
  }

  async function login() {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('review_infra_user_token', data.token);
    }
  }

  async function createStore() {
    const res = await fetch(`${API_BASE}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: storeName }),
    });

    const data = await res.json();

    if (data?.id) {
      setStore(data);
      localStorage.setItem('review_infra_store_id', data.id);
      localStorage.setItem('review_infra_api_key', data.apiKey);
    }
  }

  function connectShopify() {
    window.location.href = `${API_BASE}/shopify/auth/start?shop=${shop}`;
  }

  async function upgrade() {
    const res = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id }),
    });

    const data = await res.json();

    if (data.checkoutUrl) {
      window.open(data.checkoutUrl, '_blank');
      return;
    }

    alert(data.error || 'Checkout not configured yet');
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>

      {!token && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <input
            placeholder="Enter password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button onClick={register} style={{ padding: 10, borderRadius: 8 }}>
            Register
          </button>
          <button onClick={login} style={{ padding: 10, borderRadius: 8 }}>
            Login
          </button>
        </div>
      )}

      {token && user && !store && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 20 }}>
          <div>Signed in as {user.email}</div>
          <input
            placeholder="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button onClick={createStore} style={{ padding: 10, borderRadius: 8 }}>
            Create Store
          </button>
          <input
            placeholder="your-store.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button onClick={connectShopify} style={{ padding: 10, borderRadius: 8 }}>
            Connect Shopify
          </button>
        </div>
      )}

      {store && (
        <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
          <h3>Store Connected</h3>
          <p><b>Name:</b> {store.name}</p>
          <p><b>Shop:</b> {store.shopDomain || '-'}</p>
          <p><b>Store ID:</b> {store.id}</p>
          <p><b>API Key:</b> {store.apiKey}</p>
          <p><b>Plan:</b> {store.plan}</p>

          {store.plan === 'free' && (
            <button onClick={upgrade} style={{ padding: 10, borderRadius: 8, width: 180 }}>
              Upgrade to Pro
            </button>
          )}

          <a href="/imports" style={{ marginTop: 8 }}>Go to Imports</a>

          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, overflow: 'auto' }}>
{`<script src="${API_BASE}/embed/widget.js"></script>

<div
  data-review-product="YOUR_PRODUCT_ID"
  data-review-api="${API_BASE}"
  data-api-key="${store.apiKey}">
</div>`}
          </pre>
        </div>
      )}
    </main>
  );
}
